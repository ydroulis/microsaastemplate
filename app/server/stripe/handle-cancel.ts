 
import { db } from "@/app/lib/firebase";
import "server-only"
import Stripe from "stripe";

export async function handleStripeCancelSubscription(event: Stripe.CustomerSubscriptionDeletedEvent) {
    const costumerId = event.data.object.customer;
    
    const userRef = await db.collection("users").where("stripeCustomerId", "==", costumerId).get();

    if(userRef.empty) {
        console.log("Nao foi possivel identificar o usuario.");
        return
    }

    const userId = userRef.docs[0].id

    await db.collection("users").doc(userId).update({
        subscriptionStatus: "inactive"
    }); 
}