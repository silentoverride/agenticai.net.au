<script lang="ts">
  import { dev } from '$app/environment';
  import { onMount } from 'svelte';

  type Props = {
    publicKey: string;
    agentId: string;
    agentVersion?: string;
    recaptchaKey?: string;
  };

  let { publicKey, agentId, agentVersion = '', recaptchaKey = '' }: Props = $props();

  onMount(() => {
    if (!publicKey || !agentId) {
      if (dev) {
        console.warn(
          'Retell chat widget is disabled. Set PUBLIC_RETELL_PUBLIC_KEY and PUBLIC_RETELL_CHAT_AGENT_ID.'
        );
      }

      return;
    }

    let cancelled = false;

    const scheduleLoad = () => {
      window.setTimeout(loadWidget, 0);
    };

    const startAfterPageLoad = () => {
      if (document.readyState === 'complete') {
        scheduleLoad();
        return;
      }

      window.addEventListener('load', scheduleLoad, { once: true });
    };

    const loadWidget = () => {
      if (cancelled || document.getElementById('retell-widget')) return;

      const canUseRecaptcha =
        recaptchaKey && !['localhost', '127.0.0.1'].includes(window.location.hostname);

      if (
        canUseRecaptcha &&
        !document.querySelector('script[src^="https://www.google.com/recaptcha/api.js"]')
      ) {
        const recaptcha = document.createElement('script');
        recaptcha.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(recaptchaKey)}`;
        recaptcha.async = true;
        recaptcha.defer = true;
        document.head.appendChild(recaptcha);
      }

      const script = document.createElement('script');
      script.id = 'retell-widget';
      script.type = 'module';
      script.src = 'https://dashboard.retellai.com/retell-widget.js';
      script.async = true;
      script.defer = true;
      script.dataset.publicKey = publicKey;
      script.dataset.agentId = agentId;
      script.dataset.title = 'Chat with Annie';
      script.dataset.logoUrl = '/logo.svg';
      script.dataset.botName = 'Annie';
      script.dataset.color = '#0e9f8f';
      script.dataset.popupMessage = 'Ask Annie about the AI Business Assessment';
      script.dataset.showAiPopup = 'true';
      script.dataset.showAiPopupTime = '5';
      script.dataset.autoOpen = 'false';
      script.dataset.dynamic = JSON.stringify({
        source: 'agenticai-website',
        assessment_fee: '$1,200.00 AUD',
        terms_url: '/terms',
        privacy_url: '/privacy'
      });

      if (agentVersion) {
        script.dataset.agentVersion = agentVersion;
      }

      if (canUseRecaptcha) {
        script.dataset.recaptchaKey = recaptchaKey;
      }

      document.head.appendChild(script);
    };

    startAfterPageLoad();

    return () => {
      cancelled = true;
      window.removeEventListener('load', scheduleLoad);

    };
  });
</script>
