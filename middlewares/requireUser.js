const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { error } = require("../utils/responseWrapper");
module.exports = async (request, response, next) => {
	if (
		!request.headers ||
		!request.headers.authorization ||
		!request.headers.authorization.startsWith("Bearer")
	) {
		// return response.status(401).send("Authorization header is required");
		return response.send(error(401, "Authorization header is required"));
	}

	const accessToken = request.headers.authorization.split(" ")[1];

	try {
		const decoded = jwt.verify(
			accessToken,
			process.env.ACCESS_TOKEN_PRIVATE_KEY
		);

		request._id = decoded._id;

		const user = await User.findById(request._id);

		if (!user) {
			return response.send(error(404, "User not found"));
		}

		next();
	} catch (e) {
		console.log(e);
		// return response.status(401).send("Invalid access key");
		return response.send(error(401, "Invalid access key"));
	}
};
