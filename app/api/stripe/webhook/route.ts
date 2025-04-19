import { handleStripeCancelSubscription } from "@/app/server/stripe/handle-cancel";
import { handleStripePayment } from "@/app/server/stripe/handle-payment";
import { handleStripeSubscription } from "@/app/server/stripe/handle-subscription";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import stripe from "stripe";

const secret = process.env.STRIPE_WEBHOOK_SECRET!
export async function POST(req: NextRequest) {
    try {
        const body = await req.text();
        const headersList = await headers();
        const signature = headersList.get("stripe-signature");
    
        if(!signature || !secret) {
            return NextResponse.json({ error: "No signature or " }, { status: 400 })
        }
        const event = stripe.webhooks.constructEvent(body, signature, secret);
    
        switch (event.type) {
            case "checkout.session.completed": // pagamento unico ou assinatura concluido
                const metadata = event.data.object.metadata;
    
                if(metadata?.price === process.env.STRIPE_PRODUCT_PRICE_ID) {
                    await handleStripePayment(event)
                }
                if(metadata?.price === process.env.STRIPE_SUBSCRIPTION_PRICE_ID) {
                    await handleStripeSubscription(event)
                }
                break;
            case "checkout.session.expired": // pagamento expirado
                console.log("Enviar email para o usuario dizendo que o pagamento expirou");
                break;
            case "checkout.session.async_payment_succeeded": // boleto pago
                console.log("Enviar email para o usuario dizendo que o pagamento foi efetuado");
                break;
            case "checkout.session.async_payment_failed": // boleto nao pago
                console.log("Enviar email para o usuario dizendo que o pagamento falhou");
                break;
            case "customer.subscription.created": // assinatura criada
                console.log("Mensagem de boas vindas porque acabou de assinar");
                break;
            case "customer.subscription.deleted": // assinatura cancelada
                await handleStripeCancelSubscription(event)
                break;
            default:
                console.log(`Unhandled event type: ${event.type}`);
        }

        return NextResponse.json({ message: "Webhook received" }, { status: 200 })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}