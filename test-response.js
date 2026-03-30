import fs from 'fs';

async function run() {
  try {
    const res = await fetch('https://124f-102-206-123-155.ngrok-free.app/api/v1/admins/connexion', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({ email: 'frejus@clubpulse.tech', mot_de_passe: 'MonMotDePasse@2026' })
    });
    const data = await res.json();
    fs.writeFileSync('response.json', JSON.stringify({status: res.status, ok: res.ok, data}, null, 2));
    console.log('Written response.json');
  } catch (err) {
    console.error('ERROR', err);
  }
}

run();