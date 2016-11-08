package controller;
import db.UserContract;
import sugoi.form.Form;

class Amap extends Controller
{

	public function new() 
	{
		super();
	}
	
	@tpl("amap/default.mtt")
	function doDefault() {
		var contracts = db.Contract.getActiveContracts(app.user.amap, true, false);
		for ( c in Lambda.array(contracts).copy()) {
			if (c.endDate.getTime() < Date.now().getTime() ) contracts.remove(c);
		}
		view.contracts = contracts;
	}
	
	
	@tpl("form.mtt")
	function doEdit() {
		
		if (!app.user.isAmapManager()) throw "Vous n'avez pas accès a cette section";
		
		var group = app.user.amap;
		
		var form = Form.fromSpod(group);
	
		if (form.checkToken()) {
			form.toSpod(group);
			
			if (group.extUrl != null){
				if ( group.extUrl.indexOf("http://") ==-1 &&  group.extUrl.indexOf("https://") ==-1 ){
					group.extUrl = "http://" + group.extUrl;
				}
			}
			
			group.update();
			throw Ok("/amapadmin", "Groupe mis à jour.");
		}
		
		view.form = form;
	}
	
}