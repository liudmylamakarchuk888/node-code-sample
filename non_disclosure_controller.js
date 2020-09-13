const router = require('express').Router({mergeParams: true});
const NonDisclosure = require("../../models/non_disclosure")

const authenticate = require("../../lib/authenticators")

router
	.route("/")
		.get(authenticate.admin, async (req, res) => {
			const nonDisclosure = await NonDisclosure.get();
			res.render('./non_disclosure/edit', {title: "Update App Non Disclosure", nonDisclosure});
		})
		.put(authenticate.admin, async (req, res) => {
			try {
				const result = await NonDisclosure.update(req.body);
				res.redirect("/admin/non_disclosure");
			} catch (error) {
				req.flash("error", error.message);
				res.redirect("/admin/non_disclosure");
			}
		});

module.exports = router;