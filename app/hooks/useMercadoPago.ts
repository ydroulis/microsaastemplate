import { useRouter } from "next/navigation"
import { initMercadoPago } from "@mercadopago/sdk-react"
import { useEffect } from "react"

export default function useMercadoPago() {
    const router = useRouter()
    
    useEffect(() => {
        initMercadoPago(process.env.MERCADO_PAGO_PUBLIC_KEY!)
    }, [])
    async function createMercadoPagoCheckout({
        testeId,
        userEmail
    }: {
        testeId: string, 
        userEmail: string
    }){

        try {
            const response = await fetch("/api/mercado-pago/create-checkout", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    testeId, 
                    userEmail
                })
            })

            const data = await response.json()

            router.push(data.initPoint)
        } catch (error) {
            console.error(error)
            throw error;
        }
    }

    return{
        createMercadoPagoCheckout
    }
    
}