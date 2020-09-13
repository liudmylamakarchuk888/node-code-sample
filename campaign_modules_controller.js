const router = require('express').Router({mergeParams: true});
const CampaignModule = require("../../models/campaign_module")

const authenticate = require("../../lib/authenticators");



router.delete("/:campaign_module_id", authenticate.admin, async (req, res) => {
	try {
		const result = await CampaignModule.destroy(req.params.campaign_module_id);
		res.json(req.body);
	} catch (error) {
		console.log(error);
		res.sendStatus(500);
	}
});



module.exports = router;