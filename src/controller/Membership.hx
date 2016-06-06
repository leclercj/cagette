package controller;
import sugoi.form.elements.IntSelect;
using Std;
/**
 * Gestion des cotisations des adhérents
 * 
 * @author fbarbut<francois.barbut@gmail.com>
 */
class Membership extends controller.Controller
{

	@tpl("membership/default.mtt")
	function doDefault(member:db.User) {
		var userAmap = db.UserAmap.get(member, app.user.amap,true);
		if (userAmap == null) throw Error("/member", "Cette personne ne fait pas partie de votre AMAP");
		
		//formulaire
		var f = new sugoi.form.Form("membership");
		var year = Date.now().getFullYear();
		var data = [];
		var now = Date.now();
		for ( x in 0...5) {
			
			var y = now.getFullYear() - x;
			var yy = DateTools.delta(now, DateTools.days(365) * -x);
			data.push({label:app.user.amap.getPeriodName(yy),value:app.user.amap.getMembershipYear(yy)});
		}
		f.addElement(new IntSelect("year", "Periode", data,app.user.amap.getMembershipYear(),true));
		f.addElement(new sugoi.form.elements.DateDropdowns("date", "Date de cotisation", null, true));
		if (f.isValid()) {
			var y : Int = f.getValueOf("year");
			
			if (db.Membership.get(member, app.user.amap, y) != null) throw Error("/membership/"+member.id, "Cette cotisation a déjà été saisie");
			
			var cotis = new db.Membership();
			cotis.amap = app.user.amap;
			cotis.user = member;
			cotis.year = y;
			cotis.date = f.getElement("date").value;
			cotis.insert();
			throw Ok("/membership/"+member.id, "Cotisation enregistrée");
		}
		
		//années de cotisation
		var memberships = db.Membership.manager.search($user == member && $amap == app.user.amap,{orderBy:-year}, false);
		//for ( m in memberships) {
			//Reflect.setField(m, 'yearDate', new Date(m.year, 1, 1, 1, 1, 1));
		//}
		view.memberships = memberships;
		
		//view
		view.form = f;
		view.member = member;
		checkToken();
	}
	
	
	public function doDelete(member:db.User, year:Int,?args:{token:String}) {
		
		if (checkToken()) {
			var cotis = db.Membership.get(member, app.user.amap, year, true);
			if (cotis == null) throw Error("/", "Cette cotisation n'existe pas");
			
			cotis.delete();
			throw Ok("/membership/" + member.id, "Cotisation effacée");
		}else {
			throw Error("/", "Bad Token");
		}
		
	}
	
	
}