require('dotenv').config();
const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

async function testSend() {
    const { data, error } = await resend.emails.send({
        from: 'Acme <onboarding@resend.dev>',
        to: ['duc74p2@gmail.com'],
        subject: 'Test gửi mail bằng Resend',
        html: '<strong>Nếu bạn thấy email này, Resend hoạt động OK!</strong>',
    });

    console.log('data:', data);
    console.log('error:', error);
}

testSend();
