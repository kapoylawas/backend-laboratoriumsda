const { PrismaClient } = require('@prisma/client');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const transporter = require("../utils/email/email");

const prisma = new PrismaClient();

const findUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 5;
        const skip = (page - 1) * limit;

        const search = req.query.search || '';

        const users = await prisma.user.findMany({
            where: {
                name: {
                    contains: search,
                }
            },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                gender: true,
                alamat: true,
            },
            orderBy: {
                id: "desc",
            },
            skip: skip,
            take: limit,
        });

        const totalUsers = await prisma.user.count({
            where: {
                name: {
                    contains: search,
                }
            },
        });

        const totalPages = Math.ceil(totalUsers / limit);

        res.status(200).send({
            meta: {
                success: true,
                message: "Berhasil mengambil semua pengguna",
            },
            data: users,
            pagination: {
                currentPage: page,
                totalPages: totalPages,
                total: totalUsers,
            },
        });
    } catch (error) {
        res.status(500).send({
            meta: {
                success: false,
                message: "Terjadi kesalahan server"
            },
            errors: error
        });
    }
};

const register = async (req, res) => {
    // Validate required fields
    const requiredFields = ['name', 'email', 'nik', 'phone', 'gender', 'alamat', 'password'];
    const missingFields = requiredFields.filter(field => !req.body[field]);

    if (missingFields.length > 0) {
        return res.status(400).json({
            meta: {
                success: false,
                message: `Field berikut harus diisi: ${missingFields.join(', ')}`
            }
        });
    }

    try {
        // Hash password
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        const activationToken = uuidv4();
        const activationLink = `${req.protocol}://${req.get('host')}/api/auth/activate/${activationToken}`;

        let emailLogId; // Store the email log ID for later updates

        // Start database transaction
        const user = await prisma.$transaction(async (tx) => {
            const newUser = await tx.user.create({
                data: {
                    name: req.body.name,
                    email: req.body.email,
                    nik: req.body.nik,
                    phone: req.body.phone,
                    gender: req.body.gender,
                    alamat: req.body.alamat,
                    is_active: false,
                    password: hashedPassword,
                    activation_token: activationToken,
                    activation_token_expires: new Date(Date.now() + 24 * 60 * 60 * 1000)
                },
            });

            // Create email log and store the ID
            const emailLog = await tx.email_log.create({
                data: {
                    user_id: newUser.id,
                    email_type: 'ACCOUNT_ACTIVATION',
                    status: 'PENDING'
                }
            });
            emailLogId = emailLog.id;

            return newUser;
        });

        try {
            // Send activation email
            const mailOptions = {
                from: `"Laboratorium Sidoarjo" <noreply@sidoarjokab.go.id>`,
                to: user.email,
                subject: 'Aktivasi Akun Laboratorium Sidoarjo',
                html: `
                    <h2>Selamat datang di Laboratorium Sidoarjo</h2>
                    <p>Terima kasih telah mendaftar. Silakan klik link di bawah ini untuk mengaktifkan akun Anda:</p>
                    <p><a href="${activationLink}">${activationLink}</a></p>
                    <p>Link ini akan kadaluarsa dalam 24 jam.</p>
                    <p>Jika Anda tidak merasa mendaftar, abaikan email ini.</p>
                `
            };

            // Make sure transporter is properly imported
            if (!transporter || typeof transporter.sendMail !== 'function') {
                throw new Error('Email transporter is not properly configured');
            }

            await transporter.sendMail(mailOptions);

            // Update email log status using the stored ID
            await prisma.email_log.update({
                where: { id: emailLogId },
                data: { status: 'SENT' }
            });

            // Success response
            return res.status(201).json({
                meta: {
                    success: true,
                    message: "Registrasi berhasil. Silakan cek email Anda untuk aktivasi akun.",
                },
                data: {
                    id: user.id,
                    name: user.name,
                    email: user.email
                },
            });

        } catch (emailError) {
            console.error('Email sending failed:', emailError);

            // Update email log status using the stored ID
            await prisma.email_log.update({
                where: { id: emailLogId },
                data: { 
                    status: 'FAILED', 
                    error: emailError.message 
                }
            });

            // User was created but email failed - still return success but with warning
            return res.status(201).json({
                meta: {
                    success: true,
                    message: "Registrasi berhasil tetapi email aktivasi gagal dikirim",
                    warning: "Silakan hubungi admin untuk aktivasi manual"
                },
                data: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    manual_activation: true
                }
            });
        }

    } catch (error) {
        console.error('Registration Error:', error);

        // Handle Prisma errors
        if (error.code === 'P2002') {
            const field = error.meta?.target?.[0];
            return res.status(400).json({
                meta: {
                    success: false,
                    message: `${field} sudah terdaftar`
                }
            });
        }

        // Generic error response
        res.status(500).json({
            meta: {
                success: false,
                message: "Terjadi kesalahan server"
            },
            error_details: process.env.NODE_ENV === 'development' ? {
                name: error.name,
                message: error.message
            } : undefined
        });
    }
};

module.exports = {
    findUsers,
    register
};