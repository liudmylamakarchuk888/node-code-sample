const router = require('express').Router({mergeParams: true});
const Message = require("../../models/message");
const User = require("../../models/user");

const authenticate = require("../../lib/authenticators");

router
	.route("/")
		.get(authenticate.admin, async (req, res) => {
			const data = await Message.getAll();
			res.render('./messages/index', {title: "Manage Messages", data});
		})
		.post(authenticate.admin, async (req, res) => {
			try {
				const doc = await Message.create(req.body);
				res.redirect("/admin/messages")
			} catch (error){
				req.flash("error", error.message)
				res.redirect("/admin/messages/new");
			}
		});

router.get("/new", authenticate.admin, async (req, res) => {
	const allUsers = await User.getAll();
	const users = allUsers.sort((a, b) => a.first_name.localeCompare(b.first_name));

	res.render('./messages/new', {title: "Create Message", message: {}, users});
});

router.delete("/:message_id", authenticate.admin, async (req, res) => {
	try {
		const result = await Message.destroy(req.params.message_id);
		res.redirect("/admin/messages/");
	} catch (error){
		req.flash("error", error.message)
		res.redirect("/admin/messages");
	}
});

module.exports = router;