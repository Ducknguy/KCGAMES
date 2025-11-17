
require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const path = require('path');
const multer = require('multer');
const sgMail = require('@sendgrid/mail');

const app = express();

const PORT = process.env.PORT || 3000;
const SENDER_EMAIL = process.env.SENDER_EMAIL;
const RECEIVER_EMAIL = process.env.RECEIVER_EMAIL;
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;


if (!SENDER_EMAIL || !RECEIVER_EMAIL || !SENDGRID_API_KEY) {
    console.error("LỖI CẤU HÌNH: Thiếu SENDER_EMAIL, RECEIVER_EMAIL, hoặc SENDGRID_API_KEY trong file .env!");
    process.exit(1);
}
sgMail.setApiKey(SENDGRID_API_KEY);

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }
}).single('resume');


app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(helmet({
    contentSecurityPolicy: false,
}));



app.use('/public', express.static('public'));
app.use('/html', express.static(path.join(__dirname, 'public', 'html')));



function bufferToAttachment(buffer, filename) {
    return [
        {
            content: buffer.toString('base64'),
            filename: filename,
            type: 'application/octet-stream',
            disposition: 'attachment'
        }
    ];
}

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/:pageName', (req, res) => {
    const page = req.params.pageName;
    const filePath = path.join(__dirname, 'public', `${page}.html`);

    res.sendFile(filePath, (err) => {
        if (err) {
            if (err.code === 'ENOENT') {
                res.status(404).send('Page not found');
            } else {
                res.status(500).send('Internal Server Error');
            }
        }
    });
});

app.post('/api/send-application', (req, res) => {
    upload(req, res, async (err) => {
        try {
            if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ success: false, message: 'File CV quá lớn (tối đa 5MB).' });
            } else if (err) {
                console.error('Lỗi Multer:', err);
                return res.status(500).json({ success: false, message: 'Lỗi xử lý file đính kèm.' });
            }

            const { full_name, email, phone, job_position, notes } = req.body;
            const file = req.file;

            if (!file) return res.status(400).json({ success: false, message: 'Chưa có file CV đính kèm.' });

            const safeNotes = notes ? notes.replace(/</g, "&lt;").replace(/>/g, "&gt;") : 'Không có ghi chú.';
            const attachments = bufferToAttachment(file.buffer, file.originalname);

            const recruiterMail = {
                from: `${full_name} (Ứng Tuyển) <${SENDER_EMAIL}>`,
                to: RECEIVER_EMAIL,
                replyTo: email,
                subject: `[ỨNG TUYỂN MỚI] Vị trí ${job_position} từ ${full_name}`,
                html: `
                    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                        <h2 style="color: #007bff; border-bottom: 2px solid #eee; padding-bottom: 10px;">
                            Đơn Ứng Tuyển Mới
                        </h2>
                        <h3 style="color: #555; margin-top: 20px;">1. Thông tin Ứng viên</h3>
                        
                        <table cellpadding="8" cellspacing="0" style="width: 100%; border-collapse: collapse; border: 1px solid #ddd;">
                            <tr>
                                <td style="width: 30%; background-color: #f9f9f9; font-weight: bold; border: 1px solid #ddd;">Vị trí Ứng tuyển</td>
                                <td style="width: 70%; border: 1px solid #ddd;">${job_position}</td>
                            </tr>
                            <tr>
                                <td style="background-color: #f9f9f9; font-weight: bold; border: 1px solid #ddd;">Họ và Tên</td>
                                <td style="border: 1px solid #ddd;">${full_name}</td>
                            </tr>
                            <tr>
                                <td style="background-color: #f9f9f9; font-weight: bold; border: 1px solid #ddd;">Email</td>
                                <td style="border: 1px solid #ddd;"><a href="mailto:${email}">${email}</a></td>
                            </tr>
                            <tr>
                                <td style="background-color: #f9f9f9; font-weight: bold; border: 1px solid #ddd;">Điện thoại</td>
                                <td style="border: 1px solid #ddd;">${phone}</td>
                            </tr>
                        </table>

                        <h3 style="color: #555; margin-top: 20px;">2. Ghi chú của Ứng viên</h3>
                        <div style="border: 1px solid #ccc; padding: 15px; background-color: #fff; border-radius: 4px;">
                            ${safeNotes}
                        </div>
                        
                        <hr style="border: 0; border-top: 1px solid #eee; margin-top: 25px;">
                        
                        <p style="font-style: italic;">
                            📁 **Hành động:** CV của ứng viên đã được đính kèm. Vui lòng nhấn **Reply** để trả lời trực tiếp ứng viên.
                        </p>
                    </div>
                `,
                attachments: attachments
            };

            await sgMail.send(recruiterMail);

            const confirmationMail = {
                from: `KCGAMES HR <${SENDER_EMAIL}>`,
                to: email,
                subject: `[Xác nhận] Đã nhận đơn ứng tuyển vị trí ${job_position}`,
                html: `
                    Xin chào ${full_name},<br><br>
                    Chúng tôi đã nhận được đơn ứng tuyển của bạn cho vị trí <b>${job_position}</b>.<br>
                    Cảm ơn bạn đã quan tâm. Chúng tôi sẽ liên hệ lại trong thời gian sớm nhất.<br><br>
                    Trân trọng,<br>
                    Bộ phận Tuyển dụng KCGAMES
                `
            };

            await sgMail.send(confirmationMail);

            res.status(200).json({ success: true, message: 'Đơn ứng tuyển và email xác nhận đã gửi thành công.' });

        } catch (error) {
            console.error('Lỗi gửi email ứng tuyển:', error);
            const statusCode = error.code || 500;
            res.status(statusCode).json({ success: false, message: 'Không thể gửi đơn ứng tuyển. Vui lòng thử lại.' });
        }
    });
});

// --- ENDPOINT 2: /api/send-contact (Liên hệ) ---
app.post('/api/send-contact', async (req, res) => {
    try {
        const { full_name, email, notes } = req.body;
        if (!full_name || !email || !notes) return res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ Họ tên, Email và Nội dung.' });

        const contactMail = {
            from: `"KCGAMES HR" <${SENDER_EMAIL}>`,
            to: RECEIVER_EMAIL,
            replyTo: email,
            subject: `[LIÊN HỆ MỚI] Từ ${full_name}`,
            html: `
                <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <h2 style="color: #000000ff; border-bottom: 2px solid #eee; padding-bottom: 10px;">
                        Thông tin Liên hệ 
                    </h2>
                    <table cellpadding="8" cellspacing="0" style="width: 100%; border-collapse: collapse; border: 1px solid #ddd;">
                        <tr>
                            <td style="width: 30%; background-color: #f9f9f9; font-weight: bold; border: 1px solid #ddd;">Họ và Tên</td>
                            <td style="border: 1px solid #ddd;">${full_name}</td>
                        </tr>
                        <tr>
                            <td style="background-color: #f9f9f9; font-weight: bold; border: 1px solid #ddd;">Email</td>
                            <td style="border: 1px solid #ddd;"><a href="mailto:${email}">${email}</a></td>
                        </tr>
                    </table>
                    
                    <h3 style="color: #555; margin-top: 20px;">Nội dung</h3>
                    <div style="border: 1px solid #ccc; padding: 15px; background-color: #fff; border-radius: 4px;">
                        ${notes.replace(/</g, "&lt;").replace(/>/g, "&gt;")}
                    </div>
                </div>
            `
        };

        await sgMail.send(contactMail);
        res.status(200).json({ success: true, message: 'Gửi thông tin liên hệ thành công.' });

    } catch (error) {
        console.error('Lỗi gửi email liên hệ:', error);
        const statusCode = error.code || 500;
        res.status(statusCode).json({ success: false, message: 'Không thể gửi thông tin liên hệ. Vui lòng thử lại.' });
    }
});



app.listen(PORT, () => {
    console.log(`Server đang chạy tại http://localhost:${PORT}.`);
    console.log(`Frontend: Truy cập trang chủ tại http://localhost:${PORT}/`);
});

module.exports = app;