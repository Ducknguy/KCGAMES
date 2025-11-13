// server.js

// 1. Tải các thư viện cần thiết
require('dotenv').config();
const express = require('express');
const multer = require('multer');
const sgMail = require('@sendgrid/mail');
// const path = require('path'); // Dùng __dirname trực tiếp cho tệp tĩnh

const app = express();

// 2. Lấy thông tin từ Biến Môi Trường (.env)
const PORT = process.env.PORT || 3000;
const SENDER_EMAIL = process.env.SENDER_EMAIL; // Phải được xác thực trên SendGrid
const RECEIVER_EMAIL = process.env.RECEIVER_EMAIL;
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;

// 3. Kiểm tra cấu hình và Khởi tạo SendGrid
if (!SENDER_EMAIL || !RECEIVER_EMAIL || !SENDGRID_API_KEY) {
    console.error("LỖI CẤU HÌNH: Thiếu SENDER_EMAIL, RECEIVER_EMAIL, hoặc SENDGRID_API_KEY trong file .env!");
    process.exit(1);
}
sgMail.setApiKey(SENDGRID_API_KEY);


// 4. Cấu hình Multer để upload CV (Lưu trong bộ nhớ)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 } // Tối đa 5MB
}).single('resume');

// 5. Middleware cho Express
app.use(express.urlencoded({ extended: true }));
app.use(express.json());


// 6. PHỤC VỤ TỆP TĨNH (Sử dụng __dirname)
// Phục vụ TẤT CẢ các file trong thư mục gốc của dự án (index.html, styles.css, script.js).
app.use(express.static(__dirname));


// 7. Hàm chuyển đổi file Buffer sang Base64 cho SendGrid
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

// -----------------------------------------------------------
// --- ENDPOINT 1: /api/send-application (Ứng tuyển) ---
// -----------------------------------------------------------
app.post('/api/send-application', (req, res) => {
    upload(req, res, async (err) => {
        try {
            // Xử lý lỗi Multer
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

            // 1️⃣ Gửi mail cho nhà tuyển dụng (kèm CV) - Định dạng chuyên nghiệp
            const recruiterMail = {
                from: `${full_name} (Ứng Tuyển) <${SENDER_EMAIL}>`, // Thêm tên ứng viên
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

            // 2️⃣ Gửi email xác nhận cho ứng viên
            const confirmationMail = {
                from: `KCGAMES HR <${SENDER_EMAIL}>`,
                to: email, // Email của ứng viên
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
            // Lỗi SendGrid thường có response code
            const statusCode = error.code || 500;
            res.status(statusCode).json({ success: false, message: 'Không thể gửi đơn ứng tuyển. Vui lòng thử lại.' });
        }
    });
});

// -----------------------------------------------------------
// --- ENDPOINT 2: /api/send-contact (Liên hệ) ---
// -----------------------------------------------------------
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
                    <h2 style="color: #ffc107; border-bottom: 2px solid #eee; padding-bottom: 10px;">
                        Thông tin Liên hệ Mới
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

// -----------------------------------------------------------
// --- Khởi động Server ---
// -----------------------------------------------------------
app.listen(PORT, () => {
    console.log(`Server đang chạy tại http://localhost:${PORT}. Phục vụ frontend từ thư mục gốc.`);
});

module.exports = app;