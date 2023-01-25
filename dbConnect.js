const mongoose = require("mongoose");

module.exports = async () => {
	const uri = process.env.DATABASE;
	try {
		const connect = await mongoose.connect(uri, {
			useNewUrlParser: true,
			useUnifiedTopology: true,
		});

		console.log(`MongoDB Connected: ${connect.connection.host}`);
	} catch (e) {
		console.log(e);
	}
};
