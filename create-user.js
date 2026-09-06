const https = require('https');

const projectId = 'qggoeykojofbsywtbaah';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceRoleKey) {
  console.error('Error: SUPABASE_SERVICE_ROLE_KEY environment variable not set');
  process.exit(1);
}

const userData = {
  email: 'oriyon626@gmail.com',
  password: 'Ori@626968',
  email_confirm: true,
};

const postData = JSON.stringify(userData);

const options = {
  hostname: `${projectId}.supabase.co`,
  port: 443,
  path: '/auth/v1/admin/users',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData),
    'Authorization': `Bearer ${serviceRoleKey}`,
    'apikey': serviceRoleKey,
  },
};

const req = https.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    if (res.statusCode === 201) {
      console.log('✅ User created successfully!');
      console.log('Email:', userData.email);
      console.log('Password:', userData.password);
      const response = JSON.parse(data);
      console.log('User ID:', response.id);
    } else {
      console.error(`❌ Error (${res.statusCode}):`, data);
    }
  });
});

req.on('error', (error) => {
  console.error('Request failed:', error);
});

req.write(postData);
req.end();
