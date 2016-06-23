package tools;

/**
 * ...
 * @author fbarbut
 */
class DateTool
{

	public static function now():Date{
		return Date.now();
	}
	
	public static function deltaDays(d:Date,n:Int):Date{
		return DateTools.delta(d, n * 1000 * 60 * 60 * 24.0);
	}
	
	public static function setHourMinute(d:Date, hour:Int, minute:Int):Date{
		return new Date(d.getFullYear(), d.getMonth(), d.getDate(), hour, minute, 0);
	}
}