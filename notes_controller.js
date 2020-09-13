const router = require('express').Router({mergeParams: true});
const Note = require("../../models/note");

const authenticate = require("../../lib/authenticators");

router.post("/", authenticate.admin, async (req, res) => {
	let data = req.body;
	data.user_id = req.params.user_id

	const doc = await Note.create(data);
	res.redirect("/admin/users/" + doc.data().user_id)
});


router.delete("/:note_id", authenticate.admin, async (req, res) => {
	try {
		const result = await Note.destroy(req.params.note_id);
		res.redirect("/admin/users/" + req.params.user_id);
	} catch (error){
		req.flash("error", error.message)
		res.redirect("/admin/users/" + req.params.user_id);
	}
});

module.exports = router;