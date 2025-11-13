// server.js
require('dotenv').config();
const express = require('express');
const { Resend } = require('resend');
const multer = require('multer');

const app = express();

// Biến môi trường
const PORT = process.env.PORT || 3000;
const SENDER_EMAIL = process.env.SENDER_EMAIL || 'onboarding@resend.dev';
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RECEIVER_EMAIL = process.env.RECEIVER_EMAIL;

// Kiểm tra cấu hình quan trọng
if (!RESEND_API_KEY || !RECEIVER_EMAIL) {
    console.error("LỖI CẤU HÌNH: Thiếu RESEND_API_KEY hoặc RECEIVER_EMAIL!");
    process.exit(1);
}

// Khởi tạo Resend client
const resend = new Resend(RESEND_API_KEY);

// Multer để xử lý upload file
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }
}).single('resume');

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(__dirname));

// Chuyển Buffer sang Base64 cho attachment
function bufferToBase64(buffer, filename) {
    return {
        content: buffer.toString('base64'),
        filename
    };
}

// ----------------- ENDPOINT /api/send-application -----------------
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
            const attachment = bufferToBase64(file.buffer, file.originalname);

            // --- 1. Gửi email cho nhà tuyển dụng ---
            const recruiterMailData = {
                from: `KCGAMES HR <${SENDER_EMAIL}>`,
                to: [RECEIVER_EMAIL],
                reply_to: email,
                subject: `[Ứng Tuyển] Vị trí ${job_position} từ ${full_name}`,
                html: `
                    <h3>Thông tin ứng viên mới:</h3>
                    <p><strong>Họ và tên:</strong> ${full_name}</p>
                    <p><strong>Email:</strong> ${email}</p>
                    <p><strong>Điện thoại:</strong> ${phone}</p>
                    <p><strong>Vị trí ứng tuyển:</strong> ${job_position}</p>
                    <p><strong>Ghi chú:</strong> ${safeNotes}</p>
                    <hr>
                    <p><i>CV đã được đính kèm.</i></p>
                `,
                attachments: [attachment]
            };

            const resultRecruiter = await resend.emails.send(recruiterMailData);
            console.log("Kết quả gửi email cho nhà tuyển dụng:", resultRecruiter);

            // --- 2. Gửi email xác nhận cho ứng viên ---
            const confirmationMailData = {
                from: `KCGAMES HR <${SENDER_EMAIL}>`,
                to: [email],
                subject: `[Xác nhận] Đã nhận đơn ứng tuyển vị trí ${job_position}`,
                html: `
                    Xin chào ${full_name},<br><br>
                    Chúng tôi đã nhận được đơn ứng tuyển của bạn cho vị trí <b>${job_position}</b>.<br>
                    Cảm ơn bạn đã quan tâm. Chúng tôi sẽ liên hệ lại trong thời gian sớm nhất.<br><br>
                    Trân trọng,<br>
                    Công ty KCGAMES
                `,
            };

            const resultConfirmation = await resend.emails.send(confirmationMailData);
            console.log("Kết quả gửi email xác nhận cho ứng viên:", resultConfirmation);

            res.status(200).json({ success: true, message: 'Đơn ứng tuyển và email xác nhận đã gửi thành công.' });

        } catch (error) {
            console.error('Lỗi gửi mail:', error);
            res.status(500).json({ success: false, message: 'Không thể gửi email. Vui lòng thử lại.' });
        }
    });
});

// ----------------- ENDPOINT /api/send-contact -----------------
app.post('/api/send-contact', express.urlencoded({ extended: true }), async (req, res) => {
    try {
        const { full_name, email, notes } = req.body;
        if (!full_name || !email || !notes) {
            return res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ Họ tên, Email và Nội dung.' });
        }

        const mailData = {
            from: `KCGAMES HR <${SENDER_EMAIL}>`,
            to: [RECEIVER_EMAIL],
            reply_to: email,
            subject: `[LIÊN HỆ MỚI] Từ ${full_name}`,
            html: `
                <h3>Thông tin liên hệ:</h3>
                <p><strong>Họ và tên:</strong> ${full_name}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Nội dung:</strong> ${notes.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>
            `,
        };

        const resultContact = await resend.emails.send(mailData);
        console.log("Kết quả gửi email liên hệ:", resultContact);

        res.status(200).json({ success: true, message: 'Gửi thông tin liên hệ thành công.' });

    } catch (error) {
        console.error('Lỗi gửi email liên hệ:', error);
        res.status(500).json({ success: false, message: 'Không thể gửi thông tin. Vui lòng thử lại.' });
    }
});

app.listen(PORT, () => {
    console.log(`Server đang chạy tại http://localhost:${PORT}`);
});
