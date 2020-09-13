const router = require('express').Router({mergeParams: true});
const Admin = require("../../models/admin")

router
	.route("/")
		.get((req, res) => {
			res.render('./admins/login');
		})
		.post(async (req, res) => {
			try {
				const admin = await Admin.validate(req.body);

				res.cookie('__session', admin.id, { maxAge: 7 * 24 * 60 * 60 * 1000});				
				res.redirect("/admin/dashboard");
			} catch (error){
				req.flash("error", error.message);
				res.redirect("/admin/login");
			}
		})
		.delete((req, res) => {
			res.clearCookie('__session');
			res.redirect("/admin/login");
		});

module.exports = router;