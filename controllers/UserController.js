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
                is_active: true,
                role_id: true,
                role: {
                    select: {
                        name: true
                    }
                }
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
        const activationLink = `http://localhost:5173/aktifasi/${activationToken}`;

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
                    activation_token_expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
                    role_id: 1
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
                    <!DOCTYPE html>
                    <html lang="en">
                        <head>
                            <meta charset="UTF-8">
                            <meta name="viewport" content="width=device-width, initial-scale=1.0">
                            <title>Aktivasi Akun Laboratorium Sidoarjo</title>
                            <style>
                                @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
                                
                                body {
                                    font-family: 'Poppins', Arial, sans-serif;
                                    line-height: 1.6;
                                    color: #4a5568;
                                    margin: 0;
                                    padding: 0;
                                    background-color: #f7fafc;
                                }
                                
                                .container {
                                    max-width: 600px;
                                    margin: 0 auto;
                                    padding: 20px;
                                }
                                
                                .card {
                                    background: white;
                                    border-radius: 12px;
                                    overflow: hidden;
                                    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
                                    transition: transform 0.3s ease, box-shadow 0.3s ease;
                                }
                                
                                .card:hover {
                                    transform: translateY(-2px);
                                    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
                                }
                                
                                .header {
                                    background: linear-gradient(135deg, #2b6cb0, #4299e1);
                                    padding: 40px 20px;
                                    text-align: center;
                                    position: relative;
                                }
                                
                                .header::after {
                                    content: "";
                                    position: absolute;
                                    bottom: 0;
                                    left: 0;
                                    right: 0;
                                    height: 4px;
                                    background: linear-gradient(90deg, #f6ad55, #f687b3);
                                }
                                
                                .logo-text {
                                    color: white;
                                    font-weight: 700;
                                    font-size: 24px;
                                    letter-spacing: 0.5px;
                                    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                                }
                                
                                .header h1 {
                                    color: white;
                                    margin: 15px 0 0;
                                    font-size: 28px;
                                    font-weight: 600;
                                }
                                
                                .content {
                                    padding: 40px;
                                }
                                
                                h2 {
                                    color: #2b6cb0;
                                    margin-top: 0;
                                    font-size: 24px;
                                    font-weight: 600;
                                    position: relative;
                                    padding-bottom: 10px;
                                }
                                
                                h2::after {
                                    content: "";
                                    position: absolute;
                                    bottom: 0;
                                    left: 0;
                                    width: 50px;
                                    height: 3px;
                                    background: linear-gradient(90deg, #f6ad55, #f687b3);
                                    border-radius: 3px;
                                }
                                
                                p {
                                    margin-bottom: 20px;
                                    font-size: 16px;
                                    color: #4a5568;
                                }
                                
                                .button-container {
                                    text-align: center;
                                    margin: 30px 0;
                                }
                                
                                .button {
                                    display: inline-block;
                                    background: linear-gradient(135deg, #4299e1, #3182ce);
                                    color: white !important;
                                    text-decoration: none;
                                    padding: 14px 32px;
                                    border-radius: 8px;
                                    font-weight: 600;
                                    font-size: 16px;
                                    box-shadow: 0 4px 6px rgba(50, 50, 93, 0.11), 0 1px 3px rgba(0, 0, 0, 0.08);
                                    transition: all 0.3s ease;
                                }
                                
                                .button:hover {
                                    transform: translateY(-2px);
                                    box-shadow: 0 7px 14px rgba(50, 50, 93, 0.1), 0 3px 6px rgba(0, 0, 0, 0.08);
                                    background: linear-gradient(135deg, #3182ce, #2b6cb0);
                                }
                                
                                .link-card {
                                    background: #f8fafc;
                                    border-radius: 8px;
                                    padding: 20px;
                                    margin: 25px 0;
                                    border-left: 4px solid #4299e1;
                                    word-break: break-all;
                                }
                                
                                .divider {
                                    height: 1px;
                                    background: linear-gradient(90deg, transparent, #e2e8f0, transparent);
                                    margin: 30px 0;
                                }
                                
                                .footer {
                                    text-align: center;
                                    margin-top: 40px;
                                    color: #a0aec0;
                                    font-size: 14px;
                                }
                                
                                .highlight {
                                    background-color: #fffaf0;
                                    padding: 2px 6px;
                                    border-radius: 4px;
                                    color: #dd6b20;
                                    font-weight: 500;
                                }
                                
                                @media (max-width: 600px) {
                                    .content {
                                        padding: 30px 20px;
                                    }
                                    
                                    .header {
                                        padding: 30px 15px;
                                    }
                                }
                            </style>
                        </head>
                        <body>
                            <div class="container">
                                <div class="card">
                                    <div class="header">
                                        <div class="logo-text">LABORATORIUM SIDOARJO</div>
                                        <h1>Aktivasi Akun Anda</h1>
                                    </div>
                                    
                                    <div class="content">
                                        <h2>Selamat datang di Laboratorium Sidoarjo</h2>
                                        <p>Terima kasih telah mendaftar di platform kami. Untuk menyelesaikan proses pendaftaran, silakan verifikasi alamat email Anda dengan mengklik tombol di bawah ini:</p>
                                        
                                        <div class="button-container">
                                            <a href="${activationLink}" class="button">AKTIFKAN AKUN SAYA</a>
                                        </div>
                                            
                                        <div class="divider"></div>
                                        
                                        <p>Link aktivasi ini <span class="highlight">akan kadaluarsa dalam 24 jam</span>. Jika Anda mengalami masalah dengan link di atas, silakan hubungi tim dukungan kami.</p>
                                        
                                        <p>Jika Anda tidak merasa melakukan pendaftaran ini, Anda dapat mengabaikan email ini atau menghubungi kami di <a href="mailto:support@sidoarjokab.go.id" style="color: #4299e1; text-decoration: none;">support@sidoarjokab.go.id</a> untuk melaporkan masalah ini.</p>
                                        
                                        <div class="footer">
                                            <p>© ${new Date().getFullYear()} Dinas Kesehatan Kabupaten Sidoarjo</p>
                                            <p>Jl. Jenderal Sudirman No. 1, Sidoarjo, Jawa Timur</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </body>
                    </html>
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

const activateAccount = async (req, res) => {
    const { token } = req.params;

    try {
        // Find user with the activation token
        const user = await prisma.user.findFirst({
            where: {
                activation_token: token,
                activation_token_expires: {
                    gt: new Date() // Check if token is not expired
                }
            }
        });

        if (!user) {
            return res.status(400).json({
                meta: {
                    success: false,
                    message: "Token aktivasi tidak valid atau sudah kadaluarsa"
                }
            });
        }

        // Check if user is already active
        if (user.is_active) {
            return res.status(400).json({
                meta: {
                    success: false,
                    message: "Akun sudah aktif sebelumnya"
                }
            });
        }

        // Activate the user account
        const updatedUser = await prisma.user.update({
            where: {
                id: user.id
            },
            data: {
                is_active: true,
                activation_token: null, // Clear the activation token
                activation_token_expires: null // Clear the expiration
            },
            select: {
                id: true,
                name: true,
                email: true,
                is_active: true
            }
        });

        // Create email log for activation
        await prisma.email_log.create({
            data: {
                user_id: user.id,
                email_type: 'ACCOUNT_ACTIVATED',
                status: 'SENT'
            }
        });

        // Return success response
        return res.status(200).json({
            meta: {
                success: true,
                message: "Akun berhasil diaktifkan"
            },
            data: updatedUser
        });

    } catch (error) {
        console.error('Activation Error:', error);
        res.status(500).json({
            meta: {
                success: false,
                message: "Terjadi kesalahan server saat mengaktifkan akun"
            }
        });
    }
};

const updateUser = async (req, res) => {
    const { id } = req.params;

    let userData = {
        name: req.body.name,
        email: req.body.email,
        nik: req.body.nik,
        phone: req.body.phone,
        gender: req.body.gender,
        alamat: req.body.alamat,
        updated_at: new Date(),
    };

    try {
        // Only hash and update the password if it's provided
        if (req.body.password !== "") {

            // Hash password
            const hashedPassword = await bcrypt.hash(req.body.password, 10);

            // Tambahkan password ke objek data
            userData.password = hashedPassword;
        }

        // Mengupdate pengguna
        const user = await prisma.user.update({
            where: {
                id: Number(id),
            },
            data: userData,
        });

        res.status(200).send({
            meta: {
                success: true,
                message: "Pengguna berhasil diperbarui",
            },
            data: user,
        });
    } catch (error) {
        res.status(500).send({
            meta: {
                success: false,
                message: "Terjadi kesalahan di server",
            },
            errors: error,
        });
    }
}

const findUserById = async (req, res) => {

    const { id } = req.params;

    try {
        const user = await prisma.user.findUnique({
            where: {
                id: Number(id),
            },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                gender: true,
                alamat: true,
                is_active: true,
                role_id: true,
                role: {
                    select: {
                        name: true
                    }
                }
            },
        });

        if (!user) {
            return res.status(404).send({
                //meta untuk response json
                meta: {
                    success: false,
                    message: `Pengguna dengan ID: ${id} tidak ditemukan`,
                },
            });
        }

        // Mengirimkan respons
        res.status(200).send({
            //meta untuk response json
            meta: {
                success: true,
                message: `Berhasil mengambil pengguna dengan ID: ${id}`,
            },
            //data
            data: user,
        });
    } catch (error) {
        res.status(500).send({
            //meta untuk response json
            meta: {
                success: false,
                message: "Terjadi kesalahan di server",
            },
            //data errors
            errors: error,
        });
    }
}

const deleteUser = async (req, res) => {
    // Mendapatkan ID dari parameter
    const { id } = req.params;

    try {
        // Menghapus pengguna
        await prisma.user.delete({
            where: {
                id: Number(id),
            },
        });

        // Mengirimkan respons
        res.status(200).send({
            //meta untuk response json
            meta: {
                success: true,
                message: "Pengguna berhasil dihapus",
            },
        });
    } catch (error) {
        res.status(500).send({
            //meta untuk response json
            meta: {
                success: false,
                message: "Terjadi kesalahan di server",
            },
            //data errors
            errors: error,
        });
    }
};

module.exports = {
    findUsers,
    register,
    activateAccount,
    updateUser,
    findUserById,
    deleteUser
};