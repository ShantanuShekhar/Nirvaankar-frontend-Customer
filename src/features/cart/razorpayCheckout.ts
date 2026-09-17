export type RazorpayCheckoutResponse = {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
}

type RazorpayCheckoutInstance = {
  open: () => void
}

type RazorpayConstructor = new (options: Record<string, unknown>) => RazorpayCheckoutInstance

declare global {
  interface Window {
    Razorpay?: RazorpayConstructor
  }
}

function loadCheckoutScript(): Promise<void> {
  if (window.Razorpay) return Promise.resolve()
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-nirvaankar-razorpay]')
    if (existing) {
      existing.addEventListener('load', () => resolve())
      existing.addEventListener('error', () => reject(new Error('Could not load Razorpay')))
      return
    }
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    script.dataset.nirvaankarRazorpay = 'true'
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Could not load Razorpay'))
    document.head.appendChild(script)
  })
}

/**
 * Opens Razorpay Checkout against a backend-created order id.
 * Amount is not taken from the client — Razorpay uses the server order.
 */
export async function openRazorpayCheckout(options: {
  keyId: string
  gatewayOrderId: string
  name?: string
  email?: string | null
  contact?: string | null
}): Promise<RazorpayCheckoutResponse> {
  await loadCheckoutScript()
  const Razorpay = window.Razorpay
  if (!Razorpay) {
    throw new Error('Razorpay is not available')
  }
  if (!options.gatewayOrderId.startsWith('order_')) {
    throw new Error('Checkout did not receive a Razorpay order_id')
  }
  return new Promise((resolve, reject) => {
    let settled = false
    const checkout = new Razorpay({
      key: options.keyId,
      name: options.name ?? 'Nirvaankar',
      order_id: options.gatewayOrderId,
      prefill: {
        email: options.email ?? undefined,
        contact: options.contact ?? undefined,
      },
      theme: { color: '#1f3d2b' },
      handler: (response: RazorpayCheckoutResponse) => {
        settled = true
        resolve(response)
      },
      modal: {
        ondismiss: () => {
          if (!settled) {
            reject(new Error('Payment cancelled'))
          }
        },
      },
    })
    checkout.open()
  })
}
