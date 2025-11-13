
// server.js

// Tải các biến môi trường từ file .env
require('dotenv').config();

const express = require('express');
const nodemailer = require('nodemailer');
const multer = require('multer');
// const path = require('path');
// const fs = require('fs'); 

const app = express();

// Lấy thông tin từ Biến Môi Trường (.env)
const PORT = process.env.PORT || 3000;
const SENDER_EMAIL = process.env.SENDER_EMAIL;
const APP_PASSWORD = process.env.APP_PASSWORD;
const RECEIVER_EMAIL = process.env.RECEIVER_EMAIL;

// Kiểm tra biến môi trường quan trọng
if (!SENDER_EMAIL || !APP_PASSWORD || !RECEIVER_EMAIL) {
    console.error("LỖI CẤU HÌNH: Thiếu SENDER_EMAIL, APP_PASSWORD, hoặc RECEIVER_EMAIL trong file .env!");
    process.exit(1);
}

// --- Cấu hình Nodemailer sử dụng tài khoản SMTP thật (Gmail) ---
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: SENDER_EMAIL,
        pass: APP_PASSWORD
    },

    connectionTimeout: 60000,
    greetingTimeout: 30000,
    socketTimeout: 60000
});


const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }
}).single('resume');

app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));
// app.use(express.json());






// --- ENDPOINT API: /api/send-application ---
app.post('/api/send-application', (req, res) => {

    upload(req, res, async (err) => {

        try {
            // Xử lý lỗi File Size từ Multer
            if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({ success: false, message: 'Kích thước file CV quá lớn (tối đa 5MB).' });
            } else if (err) {
                // Lỗi multer chung chung (ví dụ: file type không hợp lệ)
                console.error('Lỗi Multer:', err);
                return res.status(500).json({ success: false, message: 'Lỗi xử lý file đính kèm.' });
            }

            // Lấy dữ liệu từ form (req.body) và file (req.file)
            const { full_name, email, phone, job_position, notes } = req.body;
            const file = req.file;

            if (!file) {
                return res.status(400).json({ success: false, message: 'Chưa có file CV đính kèm.' });
            }

            // Hàm làm sạch dữ liệu để tránh XSS
            const safeNotes = notes ? notes.replace(/</g, "&lt;").replace(/>/g, "&gt;") : 'Không có ghi chú.';


            // --- 1. Gửi Đơn Ứng Tuyển cho NHÀ TUYỂN DỤNG ---
            const recruiterMailOptions = {
                from: `"Ứng Tuyển: ${full_name}" <${SENDER_EMAIL}>`,
                to: RECEIVER_EMAIL,
                replyTo: email,
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

                attachments: [{ filename: file.originalname, content: file.buffer }]
            };

            await transporter.sendMail(recruiterMailOptions);


            // --- 2. Gửi Email Xác nhận cho ỨNG VIÊN ---
            const confirmationMailOptions = {
                from: `"Bộ phận Tuyển dụng" <${SENDER_EMAIL}>`,
                to: email,
                subject: `[Xác nhận] Đã nhận đơn ứng tuyển vị trí ${job_position}`,
                html: `
                    Xin chào ${full_name},
                    <br><br>
                    Chúng tôi đã nhận được đơn ứng tuyển của bạn cho vị trí <b>${job_position}</b>.
                    <br>
                    Cảm ơn bạn đã quan tâm. Chúng tôi sẽ liên hệ lại trong thời gian sớm nhất.
                    <br><br>
                    Trân trọng,
                    <br>
                    Công ty KCGAMES
                `,
            };

            await transporter.sendMail(confirmationMailOptions);

            // Phản hồi thành công về Frontend
            res.status(200).json({ success: true, message: 'Đơn ứng tuyển và email xác nhận đã được gửi thành công.' });

        } catch (error) {

            console.error('Lỗi gửi đơn hoặc xử lý server:', error);


            let userMessage = 'Lỗi hệ thống: Không thể gửi đơn ứng tuyển. Vui lòng thử lại.';
            if (error.code === 'EAUTH') {
                console.error("LỖI BẢO MẬT: Kiểm tra lại SENDER_EMAIL và APP_PASSWORD trong file .env!");
                userMessage = 'Lỗi xác thực email. Vui lòng liên hệ quản trị viên.';
            }

            res.status(500).json({ success: false, message: userMessage });

        } finally {

        }
    });
});


// --- ENDPOINT API: /api/send-contact ---

const textOnlyParser = express.urlencoded({ extended: true });

app.post('/api/send-contact', textOnlyParser, async (req, res) => {
    try {
        // Lấy dữ liệu (sẽ có phone và job_position mặc định)
        const { full_name, email, notes } = req.body;

        // Gửi Email Liên hệ tới Nhà Tuyển Dụng 
        if (!full_name || !email || !notes) {
            return res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ Họ tên, Email và Nội dung.' });
        }

        // --- 1. Gửi Email Liên hệ tới Nhà Tuyển Dụng ---
        const mailOptions = {
            from: `"Liên hệ: ${full_name}" <${SENDER_EMAIL}>`,
            to: RECEIVER_EMAIL,
            replyTo: email,
            subject: `[LIÊN HỆ MỚI] Từ ${full_name}`,
            html: `
                <h3>Thông tin liên hệ:</h3>
                <p><strong>Họ và tên:</strong> ${full_name}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Nội dung:</strong> ${notes.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>
            `,
        };


        await transporter.sendMail(mailOptions);

        res.status(200).json({ success: true, message: 'Gửi thông tin thành công.' });

    } catch (error) {
        console.error('Lỗi gửi liên hệ:', error);
        res.status(500).json({ success: false, message: 'Không thể gửi thông tin. Vui lòng thử lại sau.' });
    }
    finally {

    }
});




app.listen(PORT, () => {
    console.log(`Server đang chạy tại http://localhost:${PORT}`);
});


module.exports = app;