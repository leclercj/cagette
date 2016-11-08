package controller;
import haxe.crypto.Md5;
import sugoi.form.elements.Input;
import sugoi.form.Form;
import sugoi.form.elements.IntInput;
import sugoi.form.elements.StringInput;
import sugoi.form.validators.EmailValidator;
import ufront.mail.*;

enum LoginError {
	UserDoesntExists;
	BadPassword;
	NoPass;
}


class User extends Controller
{
	
	

	public function new() 
	{
		super();
	}
	
	@tpl("user/default.mtt")
	function doDefault() {
		
	}
	
	
	@tpl("user/login.mtt")
	function doLogin(?args: { name:String, pass:String } ) {
		
		if (App.current.user != null) {
			
			//if (App.current.params.exists("redirect")){
				//throw Redirect(App.current.params.get("redirect"));	
			//}else{
				throw Redirect('/');
			//}
			
		}
		
		//store a redirect if needed
		//if (App.current.params.exists("redirect")){
			//App.current.session.data.redirect = App.current.params.get("redirect");
		//}
		
		if (args != null) {
			
			//cleaning
			args.name = StringTools.trim(args.name).toLowerCase();
			args.pass = StringTools.trim(args.pass);
		
			
			//user exists ?
			var user = db.User.manager.select( $email == StringTools.trim(args.name) || $email2 == StringTools.trim(args.name) , true);
			if (user == null) {
				view.error = LoginError.UserDoesntExists.getIndex();
				return;
			}
			
			//new account
			if (!user.isFullyRegistred()) {
			
				//send mail confirmation link
				user.sendInvitation();
				throw Ok("/user/login", "Votre compte n'a pas encore été validé. Nous vous avons envoyé un email à <b>" + user.email + "</b> pour finaliser votre inscription !");
				
			}
			
			var pass = Md5.encode( App.config.get('key') + StringTools.trim(args.pass));
			
			if (user.pass != pass) {
				//empty pass
				user = db.User.manager.select( ($email == StringTools.trim(args.name) || $email2 ==StringTools.trim(args.name) ) && $pass == "", true);
				if (user == null) {
					view.error = LoginError.BadPassword.getIndex();
					return;
				}
			}
			
			login(user, args.name);
			
			//if (App.current.session.data.redirect != null){
				//var r = App.current.session.data.redirect;
				//App.current.session.data.redirect = null;
				//throw Redirect(r);	
			//}else{
				throw Redirect("/user/choose/");
			//}
			
			
		}
	}
	
	function login(user:db.User, email:String) {
		
		user.lock();
		user.ldate = Date.now();
		user.update();
		App.current.session.setUser(user);
		if (App.current.session.data == null) App.current.session.data = {};
		App.current.session.data.whichUser = (email == user.email) ? 0 : 1; //qui est connecté, user1 ou user2 ?	
		
	}
	
	/**
	 * Choose which group to connect to.
	 */
	@logged
	@tpl("user/choose.mtt")
	function doChoose(?args: { amap:db.Amap } ) {
		
		if (app.user == null) throw "Vous n'êtes pas connecté";
		
		var amaps = db.UserAmap.manager.search($user == app.user, false);
		
		if (amaps.length == 1 && !app.params.exists("show")) {
			//qu'une amap
			app.session.data.amapId = amaps.first().amapId;
			throw Redirect('/');
		}
		
		if (args!=null && args.amap!=null) {
			//select a group
			var which = app.session.data==null ? 0 : app.session.data.whichUser ;
			app.session.data = {};
			app.session.data.amapId = args.amap.id;
			app.session.data.whichUser = which;
			throw Redirect('/');
		}
		
		view.amaps = amaps;
		view.wl = db.WaitingList.manager.search($user == app.user, false);
		
		#if plugins
		view.pros = pro.db.Company.manager.search($user == app.user);
		#end
	}
	
	function doLogout() {
		App.current.session.delete();
		throw Redirect('/');
	}
	
	/**
	 * ask for password renewal by mail
	 * when password is forgotten
	 */
	@tpl("user/forgottenPassword.mtt")
	function doForgottenPassword(?key:String,?u:db.User){
		var step = 1;
		var error : String = null;
		var url = "/user/forgottenPassword";
		
		//ask for mail
		var askmailform = new Form("askemail");
		askmailform.addElement(new StringInput("email","Saisissez votre email"));
	
		//change pass form
		var chpassform = new Form("chpass");
		
		var pass1 = new StringInput("pass1", "Votre nouveau mot de passe");
		pass1.password = true;
		chpassform.addElement(pass1);
		
		var pass2 = new StringInput("pass2", "Retapez votre mot de passe pour vérification");
		pass2.password = true;
		chpassform.addElement(pass2);
		
		var uid = new IntInput("uid","uid", u == null?null:u.id);
		uid.inputType = ITHidden;
		chpassform.addElement(uid);
		
		if (askmailform.isValid()) {
			//send password renewal email
			step = 2;
			
			var email :String = askmailform.getValueOf("email");
			var user = db.User.manager.select(email == $email, false);
			
			if (user == null) throw Error(url, "Cet email n'est lié à aucun compte connu");
			
			var m = new Email();
			m.from(new EmailAddress(App.config.get("default_email"),"Cagette.net"));					
			m.to(new EmailAddress(user.email, user.name));					
			m.setSubject( App.config.NAME+" : Changement de mot de passe" );
			m.setHtml( app.processTemplate('mail/forgottenPassword.mtt', { user:user, link:'http://' + App.config.HOST + '/user/forgottenPassword/'+getKey(user)+"/"+user.id }) );
			App.getMailer().send(m);	
		}
		
		if (key != null && u!=null) {
			//check key and propose to change pass
			step = 3;
			
			if (getKey(u) == key) {
				view.form = chpassform;
			}else {
				error = "bad request";
			}
			
			
		}
		
		
		if (chpassform.isValid()) {
			//change pass
			step = 4;
			
			if ( chpassform.getValueOf("pass1") == chpassform.getValueOf("pass2")) {
				
				var uid = Std.parseInt( chpassform.getValueOf("uid") );
				var user = db.User.manager.get(uid, true);
				user.setPass(chpassform.getValueOf("pass1"));
				user.update();
				
			}else {
				error = "Vous devez saisir deux fois le même mot-de-passe";
			}
		}
			
		if (step == 1) {
			view.form = askmailform;
		}
		
		view.step = step;
		view.error = error;

	}
	
	
	/**
	 * generate a custom key for transactionnal emails, valid during the current day
	 */
	function getKey(m:db.User) {
		return haxe.crypto.Md5.encode(App.config.get("key")+m.email+(Date.now().getDate())).substr(0,12);
	}
	
	
	@logged
	@tpl("form.mtt")
	function doDefinePassword(?key:String, ?u:db.User){
		
		if (app.user.isFullyRegistred()) throw Error("/","Vous avez déjà un mot de passe");

		var form = new Form("definepass");
		var pass1 = new StringInput("pass1", "Votre nouveau mot de passe");
		var pass2 = new StringInput("pass2", "Retapez votre mot de passe pour vérification");
		pass1.password = true;
		pass2.password = true;
		form.addElement(pass1);
		form.addElement(pass2);
		
		if (form.isValid()) {
			
			if ( form.getValueOf("pass1") == form.getValueOf("pass2")) {
				
				app.user.lock();
				app.user.setPass(form.getValueOf("pass1"));
				app.user.update();
				throw Ok('/', "Bravo, votre compte est maintenant protégé par un mot de passe.");
				
			}else {
				form.addError("Vous devez saisir deux fois le même mot-de-passe");
			}
		}
		view.form = form;
		view.title = "Définissez un mot de passe pour votre compte";
	}
	
	/**
	 * landing page when coming from an invitation
	 * @param	k
	 */
	public function doValidate(k:String ) {
		
		var uid = Std.parseInt(sugoi.db.Cache.get("validation" + k));		
		if (uid == null || uid==0) throw Error('/user/login', 'Votre invitation est invalide ou a expiré ($k)');
		var user = db.User.manager.get(uid, true);
		
		login(user, user.email);
		
		app.session.data.amapId = user.getAmaps().first().id;
		
		sugoi.db.Cache.destroy("validation" + k);
	
		throw Ok("/user/definePassword", "Félicitations " + user.getName() +", votre compte est validé !");
		
		
		
	}
	
	
	
}