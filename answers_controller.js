const router = require('express').Router({mergeParams: true});
const Answer = require("../../models/answer");
const Campaign = require("../../models/campaign");
const User = require("../../models/user");
const CampaignModule = require("../../models/campaign_module");

const authenticate = require("../../lib/authenticators");


router.get("/:campaign_module_id", authenticate.admin, async (req, res) => {
	try {
		const [campaign, data, campaignModule, users] = await Promise.all([ 
			Campaign.get(req.params.campaign_id),
			Answer.getAll({campaign_id: req.params.campaign_id}), 
			CampaignModule.get(req.params.campaign_module_id),
			User.getAll({})
		]);

		const answers = data.map(answer => {
			const user = users.filter(u => parseInt(u.id) === parseInt(answer.user_id))[0] || {full_name: "Deleted"};

			const data = answer.modules || answer.data;

			let result = {
				answer: data.filter(m => { 
					return (parseInt(m.campaign_module_id) === parseInt(campaignModule.id)) || (parseInt(m.module_id) === parseInt(campaignModule.id))
				})[0],
				user: user.full_name || (user.first_name + " " + user.last_name),
				user_id: user.id,
			}

			if (typeof (result.answer || {}).answer === 'string') {
				try { result.answer.answer = JSON.parse(result.answer.answer); } catch (e) { console.log(e.message) }
			}

			return result
		}).filter(Boolean).filter(a => a.answer);

	
		res.render('./answers/show', {title: CampaignModule.MODULE_NAMES[campaignModule.module_id] + " - " + campaign.title, campaign, answers, campaignModule});
	} catch (error) {
		console.log(error);
		res.sendStatus(500);
	}
});

module.exports = router;