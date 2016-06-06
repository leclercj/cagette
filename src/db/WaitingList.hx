package db;
import sys.db.Object;
import sys.db.Types;


@:id(userId,amapId)
class WaitingList extends Object
{
	@:relation(amapId)
	public var group : Amap;
	#if neko
	public var amapId : SInt;
	#end
	
	@:relation(userId)
	public var user : db.User;
	#if neko
	public var userId : SInt;
	#end
	
	public var date : SDateTime;
	public var message : SText;
	
	public function new(){
		super();
		
		date = Date.now();
		
	}
	
}