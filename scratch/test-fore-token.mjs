async function test() {
  try {
    const token = 'X5egl9UCDlfTyNSSGA8fDY3QnZlzpMXQMvK-y9K3eOE';
    const res = await fetch('https://api.fore.coffee/store/all_with_token', {
      headers: {
        'Content-Type': 'application/json',
        'wp-token': token,
        'Origin': 'https://fore.coffee',
        'Referer': 'https://fore.coffee/id/lokasi-store/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    console.log('API Status:', res.status);
    const data = await res.json();
    console.log('Status field:', data.status);
    console.log('Payload length:', data.payload ? data.payload.length : 0);
    if (data.payload && data.payload.length > 0) {
      console.log('Sample item:', data.payload[0]);
    }
  } catch (err) {
    console.error(err);
  }
}
test();
