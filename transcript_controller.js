const router = require('express').Router({mergeParams: true});
const temiApi = require("../../lib/temiApi");

const authenticate = require("../../lib/authenticators");

router.get("/:temi_id", authenticate.admin, async (req, res) => {
	const result = await temiApi.getText(req.params.temi_id);
	res.send(result);
});



module.exports = router;