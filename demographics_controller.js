const router = require('express').Router({mergeParams: true});
const Demographic = require("../../models/demographic")

const authenticate = require("../../lib/authenticators");


router.get("/", authenticate.admin, async (req, res) => {
	try {
		const demographics = await Demographic.getAll();
		
		const allDemographics = await Demographic.getAllAvailable();
		console.log(allDemographics)

		res.render('./demographics/index', {title: "Set Initial Survey", demographics, allDemographics});
	} catch (error) {
		req.flash("error", error.message);
		res.redirect("/admin/dashboard");
	}
});

router.post("/:title", authenticate.admin, async (req, res) => {
	try {
		const result = await Demographic.addValue(req.params.title, req.body.value);
		res.redirect("/admin/demographics");
	} catch (error) {
		console.log(error);
		res.sendStatus(500);
	}
})

router.post("/:title/delete", authenticate.admin, async (req, res) => {
	try {
		const result = await Demographic.deleteValue(req.params.title, req.body.value);
		res.json(req.body);
	} catch (error) {
		console.log(error);
		res.sendStatus(500);
	}
})




module.exports = router;