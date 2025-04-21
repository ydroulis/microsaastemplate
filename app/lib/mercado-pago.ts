import { MercadoPagoConfig } from "mercadopago";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto"

const mpClient = new MercadoPagoConfig({
    accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN!,
});

export function validateMercadoPagoWebhook(req: NextRequest){
    const xSignature = req.headers.get("x-signature");
    const xRequestId = req.headers.get("x-request-id");

    if(!xSignature || !xRequestId) {
        return NextResponse.json({ error: "Missing x-signature or x-request-id" }, { status: 400 })
    }

    const signatureParts = xSignature.split(",");
    let ts = ""
    let v1 = ""
    signatureParts.forEach(part => {
        const [key, value] = part.split("=");
        if(key.trim() === "ts"){
            ts = value.trim();
        } else if (key.trim() === "v1"){
            v1 = value.trim();
        }
    })

    if(!ts || !v1) {
        return NextResponse.json({ error: "Invalid x-signature header format" }, { status: 400 })
    }

    const url = new URL(req.url)
    const dataId = url.searchParams.get("data_id")

    let manifest = ""
    if(dataId){
        manifest += `id:${dataId}`
    }
    if(xRequestId){
        manifest += `request-id:${xRequestId}` 
    }
    manifest += `ts:${ts}`

    const secret = process.env.MERCADO_PAGO_WEBHOOK_SECRET!;
    const hmac = crypto.createHmac("sha256", secret);
    hmac.update(manifest);

    const generatedHash = hmac.digest("hex");

    if(generatedHash !== v1) {
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
    }
}

export default mpClient;