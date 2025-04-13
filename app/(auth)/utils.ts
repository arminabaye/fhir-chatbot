export function postLaunch({ patientId, sessionId }: { patientId: string; sessionId: string }) {
    console.log('Firing /launch in background...');
  
    fetch('http://52.23.217.141/launch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        patientId,
      },
      body: JSON.stringify({
        metadata: { sessionId },
        userContext: {},
      }),
      keepalive: true,
    })
      .then((res) => {
        if (!res.ok) {
          console.error('Launch failed:', res.status);
        } else {
          console.log('Launch started');
        }
      })
      .catch((err) => {
        console.error('Launch error:', err);
      });
  }