// server.js
require('dotenv').config();
const express = require('express');
const multer = require('multer');
const SibApiV3Sdk = require('sib-api-v3-sdk');

const app = express();

// Biến môi trường
const PORT = process.env.PORT || 3000;
const SENDER_EMAIL = process.env.SENDER_EMAIL; // email đã verify Brevo
const RECEIVER_EMAIL = process.env.RECEIVER_EMAIL;
const BREVO_API_KEY = process.env.BREVO_API_KEY;

// Kiểm tra cấu hình
if (!SENDER_EMAIL || !RECEIVER_EMAIL || !BREVO_API_KEY) {
    console.error("Thiếu biến môi trường: SENDER_EMAIL, RECEIVER_EMAIL hoặc BREVO_API_KEY");
    process.exit(1);
}

// Khởi tạo Brevo client
let defaultClient = SibApiV3Sdk.ApiClient.instance;
let apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = BREVO_API_KEY;
const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

// Multer để xử lý upload file CV
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 }
}).single('resume');

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(__dirname));

// Chuyển Buffer sang attachment format Brevo
function bufferToAttachment(buffer, filename) {
    return [{
        content: buffer.toString('base64'),
        name: filename
    }];
}

// ----------------- /api/send-application -----------------
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

            // 1️⃣ Gửi mail cho nhà tuyển dụng
            const recruiterMail = new SibApiV3Sdk.SendSmtpEmail({
                sender: { email: SENDER_EMAIL, name: 'KCGAMES HR' },
                to: [{ email: RECEIVER_EMAIL }],
                replyTo: { email: email },
                subject: `[Ứng Tuyển] Vị trí ${job_position} từ ${full_name}`,
                htmlContent: `
                    <h3>Thông tin ứng viên mới:</h3>
                    <p><strong>Họ và tên:</strong> ${full_name}</p>
                    <p><strong>Email:</strong> ${email}</p>
                    <p><strong>Điện thoại:</strong> ${phone}</p>
                    <p><strong>Vị trí ứng tuyển:</strong> ${job_position}</p>
                    <p><strong>Ghi chú:</strong> ${safeNotes}</p>
                    <hr>
                    <p><i>CV đã được đính kèm.</i></p>
                `,
                attachment: attachments
            });

            const resultRecruiter = await apiInstance.sendTransacEmail(recruiterMail);
            console.log("Kết quả gửi email cho nhà tuyển dụng:", resultRecruiter);

            // 2️⃣ Gửi mail xác nhận cho ứng viên
            const confirmationMail = new SibApiV3Sdk.SendSmtpEmail({
                sender: { email: SENDER_EMAIL, name: 'KCGAMES HR' },
                to: [{ email: email }],
                subject: `[Xác nhận] Đã nhận đơn ứng tuyển vị trí ${job_position}`,
                htmlContent: `
                    Xin chào ${full_name},<br><br>
                    Chúng tôi đã nhận được đơn ứng tuyển của bạn cho vị trí <b>${job_position}</b>.<br>
                    Cảm ơn bạn đã quan tâm. Chúng tôi sẽ liên hệ lại trong thời gian sớm nhất.<br><br>
                    Trân trọng,<br>
                    Công ty KCGAMES
                `
            });

            const resultConfirmation = await apiInstance.sendTransacEmail(confirmationMail);
            console.log("Kết quả gửi email xác nhận cho ứng viên:", resultConfirmation);

            res.status(200).json({ success: true, message: 'Đơn ứng tuyển và email xác nhận đã gửi thành công.' });

        } catch (error) {
            console.error('Lỗi gửi email:', error.response ? error.response.body : error);
            res.status(500).json({ success: false, message: 'Không thể gửi email. Vui lòng thử lại.' });
        }
    });
});

// ----------------- /api/send-contact -----------------
app.post('/api/send-contact', express.urlencoded({ extended: true }), async (req, res) => {
    try {
        const { full_name, email, notes } = req.body;
        if (!full_name || !email || !notes) return res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ Họ tên, Email và Nội dung.' });

        const contactMail = new SibApiV3Sdk.SendSmtpEmail({
            sender: { email: SENDER_EMAIL, name: 'KCGAMES HR' },
            to: [{ email: RECEIVER_EMAIL }],
            replyTo: { email: email },
            subject: `[LIÊN HỆ MỚI] Từ ${full_name}`,
            htmlContent: `
                <h3>Thông tin liên hệ:</h3>
                <p><strong>Họ và tên:</strong> ${full_name}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Nội dung:</strong> ${notes.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>
            `
        });

        const resultContact = await apiInstance.sendTransacEmail(contactMail);
        console.log("Kết quả gửi email liên hệ:", resultContact);

        res.status(200).json({ success: true, message: 'Gửi thông tin liên hệ thành công.' });

    } catch (error) {
        console.error('Lỗi gửi email liên hệ:', error.response ? error.response.body : error);
        res.status(500).json({ success: false, message: 'Không thể gửi thông tin. Vui lòng thử lại.' });
    }
});

app.listen(PORT, () => {
    console.log(`Server đang chạy tại http://localhost:${PORT}`);
});
