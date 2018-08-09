module.exports= {
    mailer: {
		from: process.env.MAILER_FROM || 'dibsdibs55@gmail.com',
		options: {
			service: process.env.MAILER_SERVICE_PROVIDER || 'GMAIL',
			auth: {
				user: process.env.MAILER_EMAIL_ID || 'dibsdibs55@gmail.com',
				pass: process.env.MAILER_PASSWORD || 'tamarandkobi'
			},
			host: 'smtp.gmail.com',
			port: 587
			}
	},
};