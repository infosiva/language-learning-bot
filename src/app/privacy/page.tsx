export default function PrivacyPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16 text-white/80">
      <h1 className="text-3xl font-bold text-white mb-6">Privacy Policy</h1>
      <p className="mb-4">Last updated: May 2026</p>
      <p className="mb-4">SpeakIQ collects only the data needed to provide the service: your email address (for login), language preferences, and lesson progress stored locally in your browser.</p>
      <p className="mb-4">We do not sell your data. We do not share your data with third parties except as required to operate the service (e.g., AI providers for lesson generation).</p>
      <p className="mb-4">AI lesson content is processed by third-party LLM providers. Do not include sensitive personal information in lesson prompts.</p>
      <p className="mb-4">You can delete your account and all associated data at any time by contacting us at <a href="mailto:hello@speakiq.app" className="text-orange-400 hover:underline">hello@speakiq.app</a>.</p>
    </div>
  )
}
