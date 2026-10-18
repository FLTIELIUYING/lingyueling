/* 蜀山剑门独立扩展：不修改原卡与变量校验脚本。 */
(async()=>{
function createShushanCore(){
  'use strict';
  const own=(o,k)=>Object.prototype.hasOwnProperty.call(o||{},k);
  const obj=o=>o&&typeof o==='object'&&!Array.isArray(o)?o:{};
  const clone=o=>JSON.parse(JSON.stringify(o));
  const safe=k=>typeof k==='string'&&k.length>0&&k.length<180&&!['__proto__','prototype','constructor'].includes(k);
  const str=(s,n=2000)=>typeof s==='string'?s.slice(0,n):'';
  const count=n=>Number.isSafeInteger(n)&&n>=0;
  const member=s=>/^蜀山剑门/.test(str(s?.主角?.宗门))&&!/(?:未加入|已退出|被逐|叛离|脱离|准备加入)/.test(s.主角.宗门);
  const roles=['外门杂役','外门弟子','内门弟子','峰主真传','宗主真传','真传弟子','长老','大长老','宗主'];
  const ranks={'外门杂役':0,'杂役弟子':0,'外门弟子':1,'内门弟子':2,'真传弟子':3,'峰主真传':3,'峰主真传弟子':3,'宗主真传':3,'宗主真传弟子':3,'长老':4,'大长老':5,'宗主':6,'掌门':6};
  function parseRole(value){const t=str(value).split(/[（(]/)[0];if(/大长老/.test(t))return '大长老';if(/长老(?!门下|弟子|亲传|真传)/.test(t))return '长老';if(/(?:宗主|掌门)(?:真传|亲传)/.test(t))return '宗主真传';if(/峰主(?:真传|亲传)/.test(t))return '峰主真传';if(/(?:宗主|掌门)(?!门下|弟子|真传|亲传|候选|继承)/.test(t))return '宗主';if(/真传|亲传/.test(t))return '真传弟子';if(/内门弟子/.test(t))return '内门弟子';if(/外门弟子/.test(t))return '外门弟子';if(/外门杂役|杂役弟子/.test(t))return '外门杂役';return '';}
  function role(s,x){return parseRole(s?.主角?.宗门)||parseRole(x?.名籍?.身份)||'身份待核对';}
  const rank=(s,x)=>ranks[role(s,x)]??-1;
  function blank(s,groups=[]){
    const bag=Object.entries(obj(s?.主角?.储物袋)).filter(([k,v])=>/^蜀山剑门.+峰弟子令牌$/.test(k)&&v?.数量!==0).map(([k])=>k).join('\n');
    const text=str(s?.主角?.宗门)+' '+bag;
    const peaks=['飞霜峰','镇岳峰','凌虚峰','抱朴峰','冲霄峰','无我峰'].filter(p=>text.includes(p));
    return {名籍:{峰脉:peaks.length===1?peaks[0]:'',身份:parseRole(s?.主角?.宗门),居所:'',入门时间:'',入门方式:'背景承接'},剑札:{},课业:{},闻讯:{},雅集:Object.fromEntries(groups.map(g=>[g.id,clone(g.value)])),我的雅集:[],目录:{},借阅:{},办理:{}};
  }
  function extension(s){return obj(s?.蜀山剑门);}
  function collection(x,key){return Object.entries(obj(x?.[key])).filter(([id,v])=>safe(id)&&v&&typeof v==='object'&&!Array.isArray(v));}
  function check(s){
    if(!member(s))throw new Error('当前没有正式蜀山身份。');
    if(!s.主角||!count(s.主角.宗门贡献))throw new Error('宗门贡献须为非负整数，请先核对原卡变量。');
    const x=extension(s);if(!Array.isArray(x.我的雅集)||new Set(x.我的雅集).size!==x.我的雅集.length||x.我的雅集.length>2)throw new Error('雅集归属需核对：每位弟子最多两个，且不可重复。');
  }
  function permitted(s,x,item){
    const need=str(item.最低身份),level=rank(s,x);
    if(item.方式==='借阅'&&item.层级==='内门'&&level<2)return false;
    if(item.方式==='借阅'&&item.层级==='地阶以上'&&level<3&&item.已获特许!==true)return false;
    if(own(ranks,need)&&level<ranks[need])return false;
    if(item.需特许===true&&item.已获特许!==true)return false;
    return true;
  }
  function request(s,type,id,options={}){
    check(s);const x=extension(s),rid=options.rid;if(!safe(rid))throw new Error('办理编号无效。');
    if(own(x.办理,rid))throw new Error('该办理编号已存在。');
    if(collection(x,'办理').some(([,r])=>['待确认','已批准'].includes(r.状态)&&r._凭证?.对象===id&&r._凭证?.类型===type))throw new Error('这项事务已有待办申请，请先处理原申请。');
    const time=str(s.世界?.当前时间),p={类型:type,对象:id,名称:'',数量:1,天数:1,单价:0,总价:0};
    if(['兑换','借阅','传承'].includes(type)){
      const offer=obj(x.目录?.[id]);if(!offer.名称||offer.方式!==type)throw new Error('目录条目已变化，请重新核对。');
      if(!permitted(s,x,offer))throw new Error('当前身份或特许尚未满足。');
      if(!count(offer.单价))throw new Error('尚未取得明确报价，请先问询。');
      p.名称=str(offer.名称,150);p.分类=str(offer.分类,30);p.单价=offer.单价;
      if(type==='借阅'){
        p.天数=Number(options.days||1);const max=offer.层级==='地阶以上'?1:offer.层级==='内门'?3:7;
        if(!Number.isInteger(p.天数)||p.天数<1||p.天数>max)throw new Error('借阅期限不符合藏经阁规则。');
        const exact=offer.层级==='内门'?100:offer.层级==='外门'?10:null;
        if(exact!==null&&offer.单价!==exact)throw new Error('借阅报价与藏经阁日费规则不符，请核对。');
        if(offer.层级==='地阶以上'&&(offer.单价<5000||offer.单价>50000))throw new Error('地阶以上阅览报价应在规定区间内。');
        p.总价=p.单价*(offer.层级==='地阶以上'?1:p.天数);
      }else{
        p.数量=Number(options.qty||1);if(!Number.isInteger(p.数量)||p.数量<1||p.数量>99)throw new Error('兑换数量应为 1 至 99。');
        if(type==='传承'&&p.数量!==1)throw new Error('功法传承按一次申请办理。');
        if(count(offer.库存)&&p.数量>offer.库存)throw new Error('当前库存不足。');
        if(offer.分类==='器物'&&p.数量!==1)throw new Error('器物按独立名称逐件登记。');
        p.总价=p.单价*p.数量;
      }
      if(!count(p.总价)||p.总价>s.主角.宗门贡献)throw new Error('宗门贡献不足。');
      p.报价=clone(offer);
    }else if(['入社','退社'].includes(type)){
      const g=obj(x.雅集?.[id]);if(!g.名称)throw new Error('该雅集尚未登记。');p.名称=g.名称;
      if(type==='入社'&&(x.我的雅集.length>=2||x.我的雅集.includes(id)))throw new Error('雅集名额已满或已经加入。');
      if(type==='退社'&&!x.我的雅集.includes(id))throw new Error('尚未加入这个雅集。');
    }else if(type==='建社'){
      if(x.我的雅集.length>=2)throw new Error('雅集名额已满。');
      const g=obj(options.group);if(!safe(id)||!str(g.名称)||!/(社|会|同好)$/.test(g.名称)||!str(g.简介)||!str(g.场所))throw new Error('请填写雅集名称、简介与场所，名称以社、会或同好结尾。');
      if(collection(x,'雅集').some(([,v])=>v.名称===g.名称))throw new Error('已存在同名雅集。');
      p.名称=str(g.名称,40);p.雅集={名称:p.名称,社印:'社',主题:'弟子自发',诗句:'',简介:str(g.简介,500),场所:str(g.场所,100),联系人:[],活动:{}};
    }else if(type==='归还'){
      const b=obj(x.借阅?.[id]);if(b.状态!=='借阅中')throw new Error('该借阅已经归还或尚未办理。');p.名称=b.名称;
    }else throw new Error('未知办理类型。');
    return {编号:rid,状态:'待确认',申请时间:time,_凭证:p,说明:'',结果:{}};
  }
  function payload(p,receipt){
    const value=obj(receipt.结果),name=str(value.名称||p.名称,150);if(!safe(name))throw new Error('所得名称无效。');
    const kind=p.类型==='传承'?'功法':p.分类;
    if(kind==='器物'){
      const v={等级:str(value.等级,50),类型:str(value.类型,150),损耗度:0,状态:str(value.状态,150)||'正常',描述:str(value.描述)};
      if(!v.等级||!v.类型||v.描述.length<30)throw new Error('器物结果缺少等级、类型或完整描述，暂不扣款。');
      return {field:'器物',name,value:v};
    }
    if(kind==='功法'){
      if(p.类型!=='传承')throw new Error('功法需按传承或借阅办理。');
      if(value.已习得!==true)throw new Error('传承尚未实际习得，暂不录入或扣款。');
      const v={类型:str(value.类型,150),境界:str(value.境界,100)||'入门',熟练度:0,描述:str(value.描述)};
      if(!v.类型||v.描述.length<30)throw new Error('功法结果字段尚不完整，暂不扣款。');
      return {field:'功法',name,value:v};
    }
    const desc=str(value.描述);if(!desc)throw new Error('物资说明不完整，暂不扣款。');
    return {field:'储物袋',name,value:{描述:desc,数量:p.数量}};
  }
  function settle(data,rid){
    const before=clone(data),s=before.stat_data;check(s);const x=extension(s),receipt=obj(x.办理?.[rid]);
    if(receipt.状态==='已完成')return {changed:false,data:before};
    if(receipt.状态!=='已批准')throw new Error('办理尚未获准。');
    const p=obj(receipt._凭证);if(!p.类型||!count(p.总价))throw new Error('原申请凭证缺失，未结算。');
    if(p.总价>s.主角.宗门贡献)throw new Error('成交时宗门贡献不足，未扣款。');
    if(['兑换','借阅','传承'].includes(p.类型)){
      const offer=obj(p.报价);if(!permitted(s,x,offer))throw new Error('成交时身份资格已变化，未扣款。');
      if(p.类型==='借阅'){
        if(!str(receipt.结果?.应还时间))throw new Error('借阅应还时间未填写，请按剧情历法补全。');
        x.借阅=x.借阅||{};x.借阅[rid]={名称:p.名称,层级:offer.层级||'',天数:p.天数,起借时间:str(s.世界?.当前时间),应还时间:receipt.结果.应还时间,状态:'借阅中',费用:p.总价};
      }else{
        const item=payload(p,receipt),inventory=obj(s.主角[item.field]);s.主角[item.field]=inventory;
        if(item.field!=='储物袋'&&own(inventory,item.name))throw new Error('已有同名'+item.field+'，需先核对处理方式，未扣款。');
        if(item.field==='储物袋'&&own(inventory,item.name)){
          if(!count(inventory[item.name].数量))throw new Error('原物品数量无效，未扣款。');item.value.数量+=inventory[item.name].数量;
        }
        Object.defineProperty(inventory,item.name,{value:item.value,writable:true,enumerable:true,configurable:true});
        const live=x.目录?.[p.对象];if(count(live?.库存)){if(live.库存<p.数量)throw new Error('成交时库存不足，未扣款。');live.库存-=p.数量;}
      }
      s.主角.宗门贡献-=p.总价;
    }else if(p.类型==='入社'){
      if(!x.我的雅集.includes(p.对象)){if(x.我的雅集.length>=2)throw new Error('名额已满，未加入。');x.我的雅集.push(p.对象);}
    }else if(p.类型==='退社')x.我的雅集=x.我的雅集.filter(id=>id!==p.对象);
    else if(p.类型==='建社'){
      if(x.我的雅集.length>=2)throw new Error('名额已满，未成立。');
      if(!safe(p.对象)||own(x.雅集,p.对象))throw new Error('雅集编号重复，未成立。');x.雅集[p.对象]=clone(p.雅集);x.我的雅集.push(p.对象);
    }else if(p.类型==='归还'){
      if(x.借阅?.[p.对象]?.状态!=='借阅中')throw new Error('该借阅状态已变化。');x.借阅[p.对象].状态='已归还';
    }else throw new Error('办理类型无效。');
    receipt.状态='已完成';receipt.完成时间=str(s.世界?.当前时间);receipt.实扣贡献=p.总价;
    return {changed:true,data:before,label:p.名称};
  }
  function settleTask(data,id){
    const next=clone(data),s=next.stat_data;check(s);const t=extension(s).剑札?.[id];
    if(!t||t.状态!=='待结算'||t._已结算)return {changed:false,data:next};
    if(!t._接取时间)throw new Error('任务缺少接取凭据，请核对接取经历。');
    if(!count(t.奖励贡献))throw new Error('任务奖励不是明确的非负整数，未结算。');
    s.主角.宗门贡献+=t.奖励贡献;if(!count(s.主角.宗门贡献))throw new Error('任务奖励超出可保存范围。');
    t.状态='已完成';t._已结算=true;t.结算时间=str(s.世界?.当前时间);return {changed:true,data:next,label:t.名称};
  }
  function summary(s){
    const x=extension(s),active=collection(x,'剑札').filter(([,t])=>['进行中','待结算'].includes(t.状态)),pending=collection(x,'办理').filter(([,r])=>['待确认','已批准'].includes(r.状态));
    return '【蜀山扩展当前状态｜只在正式身份成立后提供】\n宗门：'+s.主角.宗门+'；宗门贡献：'+s.主角.宗门贡献+'。\n进行中剑札：'+JSON.stringify(Object.fromEntries(active))+'\n待办理申请：'+JSON.stringify(Object.fromEntries(pending))+'\n我的雅集：'+JSON.stringify(x.我的雅集||[])+'\n本扩展数据位于 stat_data.蜀山剑门；不要塞入主角对象或普通机遇。UI办理的扣费、发放、任务贡献结算由独立脚本一次完成，AI只核对剧情并更新申请状态与结果，切勿重复改动同笔贡献或物品。没有申请时的自然剧情收获仍按原卡规则处理。';
  }
  return {own,obj,clone,safe,str,count,member,roles,role,parseRole,rank,blank,extension,collection,check,permitted,request,settle,settleTask,summary};
}

function createShushanTimeline(options){
  'use strict';
  const {C,parseDate,formatDate,addMonths}=options;
  const DAY=86400000,BASE=3727;
  const RULES=[
    {名称:'宗门招收季',周期:10,首年:3726,届次偏移:1,月:12,日:1,月数:3,说明:'剑舟引渡、测灵与入门登记。已有蜀山身份者可协助迎新，无需再行拜入。',阶段:['剑舟巡游与接引','测灵与问心','登记名籍与安置']},
    {名称:'新生大比',周期:10,招生后月数:6,月数:1,说明:'本届招生季结束满半年，统一试剑一月；外门新生经实际优胜与复核可破格入内门。',阶段:['抽签与初试','实战复赛','决选','破格复核与授礼']},
    {名称:'论剑大会',周期:10,首年:3730,月:6,日:1,月数:2,说明:'各峰论剑，角逐十大剑子。选剑与赐诀均按真实赛果办理。',阶段:['分组与验剑','峰内预选','跨峰竞逐','半决论剑','剑子决选与授礼']},
    {名称:'春山巡护',周期:1,月:4,日:5,天数:3,说明:'同门结伴巡看春汛山道与新植灵苗，归来在山亭交换见闻；可领短差，也可只随行识路。',阶段:['领路与分组','巡山看苗','归亭交接']},
    {名称:'望月灯会',周期:1,月:8,日:15,天数:3,说明:'望云台煮茶赏月、续诗试灯，雅集可自发设席；赴约与交情依实际相处，不统一增加好感。',阶段:['筹灯与邀约','望月相聚','收灯与回访']},
    {名称:'归藏晒经',周期:1,月:11,日:1,天数:3,说明:'藏经阁开放外院校书、晒卷与养剑心得小席，受限典籍不外借；值事可安排适合身份的短工。',阶段:['理卷与报名','晒经与交流','归架与交接']},
    {名称:'锁妖塔封镇祭',周期:1,首年:1,月:12,日:15,天数:14,说明:'祭前整备、冬至封镇与祭后复核。外门可在规定区域观礼。',阶段:['核验阵基与整备','列阵护法与正式封镇','复核与交接']},
    {名称:'金符甲子大修',周期:60,首年:3787,月:12,日:1,月数:1,说明:'每甲子的塔身金符大修，与年度封镇祭分开安排。',阶段:['勘验与筹料','金符修缮','验阵与复核']}
  ];
  function stamp(y,m,d){return parseDate(`${y}年${m}月${d}日00点00分`);}
  function row(s,id,name,start,end,desc,phases=[]){
    const now=parseDate(s?.世界?.当前时间);if(now===null||start===null||end===null||end<=start)return null;
    const 状态=now>=end?'已结束':now>=start?'进行中':now>=start-30*DAY?'报名中':'未开放';
    const p=Math.min(phases.length-1,Math.floor((now-start)/(end-start)*phases.length));
    return {id,名称:name,开始:formatDate(start),结束:formatDate(end),开始值:start,结束值:end,状态,距开始日:Math.max(0,Math.ceil((start-now)/DAY)),说明:desc,阶段:状态==='进行中'?(phases[p]||'依主事安排进行'):状态==='报名中'?'报名与资格核验':状态==='已结束'?'本届结束':'尚待开期'};
  }
  function recruitmentEnd(cohort){const r=RULES.find(e=>e.名称==='宗门招收季'),start=stamp(cohort-(r.届次偏移||0),r.月,r.日);return start===null?null:addMonths(start,r.月数);}
  function fixed(s,r,y){const base=r.首年||BASE;if(y<base||(y-base)%r.周期)return null;const end=r.招生后月数!==undefined?recruitmentEnd(y):null,start=r.招生后月数!==undefined?(end===null?null:addMonths(end,r.招生后月数)):stamp(y,r.月,r.日);return row(s,r.名称+'-'+(y+(r.届次偏移||0)),r.名称,start,start===null?null:r.月数?addMonths(start,r.月数):start+r.天数*DAY,r.说明,r.阶段);}
  function extras(s){const x=C.extension(s),out=[];
    for(const [id,e]of C.collection(x.岁序,'临时活动')){const r=row(s,'临时-'+id,e.名称,parseDate(e.开始),parseDate(e.结束),C.str(e.说明)||'依正式排期与主事安排。');if(r)out.push(r);}
    return out.filter(Boolean);
  }
  function normalize(s){
    const x=C.extension(s);if(!x.活动记录)return;
    for(const [old,rec]of C.collection(x,'活动记录')){
      if(rec.名称!=='新生大比'||!/^新生大比-\d{7,}$/.test(old))continue;
      const suffix=old.slice('新生大比-'.length),date=suffix.match(/^(\d{4,6})(\d{2})(\d{2})$/);
      let joined=date?stamp(+date[1],+date[2],+date[3]):null;
      if(joined===null&&/^\d{13,17}$/.test(suffix)){const value=Number(suffix),y=new Date(value).getUTCFullYear();if(Number.isSafeInteger(value)&&y>=1&&y<=275000)joined=value;}
      if(joined===null){const start=parseDate(rec.开始);joined=start!==null?addMonths(start,-6):parseDate(x.名籍?.入门时间);}
      if(joined===null)continue;
      const year=new Date(joined).getUTCFullYear();let cohort=BASE+Math.max(0,Math.ceil((year-BASE)/10))*10;
      if(joined>recruitmentEnd(cohort))cohort+=10;
      const id='新生大比-'+cohort,existing=x.活动记录[id];
      if(existing){const merged={...rec,...existing};for(const key of ['报名','确认参加','优胜确认'])if(rec[key]===true)merged[key]=true;if(!['已完成','已结束'].includes(existing.状态)&&['已完成','已结束'].includes(rec.状态))merged.状态=rec.状态;x.活动记录[id]=merged;}
      else x.活动记录[id]=rec;
      delete x.活动记录[old];
      for(const [,q]of C.collection(x,'剑札'))if(q.活动编号===old)q.活动编号=id;
      const flags=x.日程标记,from='宗门:'+old,to='宗门:'+id;if(flags&&C.own(flags,from)){flags[to]??={...flags[from],来源编号:id};delete flags[from];}
    }
  }
  function upcoming(s){const now=parseDate(s?.世界?.当前时间);if(now===null)return [];const year=new Date(now).getUTCFullYear(),rows=[];
    for(const r of RULES){const base=r.首年||BASE;let y=base+Math.max(0,Math.floor((year-base)/r.周期))*r.周期,e=fixed(s,r,y);if(e&&now>=e.结束值)e=fixed(s,r,y+r.周期);if(e)rows.push(e);}
    return [...rows,...extras(s)].sort((a,b)=>a.开始值-b.开始值);
  }
  function between(s,start,end){if(!Number.isFinite(start)||!Number.isFinite(end)||end<=start)return [];const a=new Date(start).getUTCFullYear()-1,b=new Date(end).getUTCFullYear();if(b-a>4)throw new Error('请按月查看宗门日历。');const rows=[];for(let y=a;y<=b;y++)for(const r of RULES){const e=fixed(s,r,y);if(e&&e.开始值<end&&e.结束值>start)rows.push(e);}return [...rows,...extras(s).filter(e=>e.开始值<end&&e.结束值>start)].sort((a,b)=>a.开始值-b.开始值);}
  return {BASE,RULES,upcoming,between,normalize};
}

function createShushanGrowth(C){
  'use strict';
  const PEAKS=['飞霜峰','镇岳峰','凌虚峰','抱朴峰','冲霄峰','无我峰'];
  const REALMS=['炼气','筑基','金丹','元婴','化神','炼虚','合体','大乘','渡劫'];
  const DEPTS=[['任务堂','外勤文书、护送与情报核验'],['内务堂','名册、晋升登记与功德核对'],['执法堂','巡查、取证与护山执勤'],['勤务殿','灵田、膳食、仓储与采购'],['功德堂','物资验收与兑换事务'],['教务堂','课业与新弟子指导'],['藏经阁','典籍整理与借阅核对'],['执事堂','跨部门协调与会议事务'],['丹鼎阁','炉料、炼丹与药理事务'],['符阵阁','符箓、阵基与护山阵法']].map(([名称,职责])=>({名称,职责}));
  const DUTIES={'任务堂':['剑札核访','协助核对一份外勤委托的地点、委托人与交接凭据，回报主事。'],'内务堂':['名籍校录','协助核对新旧弟子名籍、令牌与安置文书，发现差错先请主事复核。'],'执法堂':['山道巡值','依主事指派巡查开放山道，记下异常并交接；不独闯禁区或擅捕高阶修士。'],'勤务殿':['灵田与仓储清点','领取指定区域的灵田、膳食或仓储清点工作，依清单核验并交还回执。'],'功德堂':['物资验收','协助核验一批宗门物资的品类、数量与品质，交主事复核账目。'],'教务堂':['课务协办','协助安排一场基础课的场地、名册与器具，按自身修为承担辅助工作。'],'藏经阁':['典籍整理','整理开放区域的借阅簿与典籍，核对归还情况，不擅取受限剑诀。'],'执事堂':['诸司文书交接','传递并核验部门间的文书与回执，记录待协调事项后回报。'],'丹鼎阁':['药材辨验','协助辨验药材、核对炉料与药理记录，疑难药性请教师长，不擅自开炉。'],'符阵阁':['阵基巡检','跟随执事检查开放区域的阵基与常用符箓，记录损耗，不擅动护山核心。']};
  const realm=s=>{const t=C.str(s?.主角?.境界);const i=REALMS.findIndex(r=>t.includes(r)||r==='炼气'&&t.includes('练气'));return i<0&&/真仙|金仙|玄仙|仙帝|超脱/.test(t)?9:i;};
  const ext=s=>C.extension(s),unique=a=>[...new Set(a)],text=v=>C.str(v).trim();
  function registered(s){return C.collection(ext(s),'峰脉名录').filter(([,p])=>p.状态==='已立峰'&&p.宗门认可===true&&/峰$/.test(text(p.名称))&&text(p.名称).length<=30).map(([,p])=>p.名称);}
  function profile(s){
    const x=ext(s),n=C.obj(x.名籍),r=C.role(s,x),direct=r==='宗主真传',leader=C.rank(s,x)>=4;
    const allowed=unique([...PEAKS,...registered(s)]),raw=text(n.峰脉),main=allowed.filter(p=>text(s?.主角?.宗门).includes(p));
    const tokens=[];for(const [name,item]of Object.entries(C.obj(s?.主角?.储物袋))){if(item?.数量===0)continue;const m=name.match(/^蜀山剑门(.+峰)弟子令牌$/);if(m&&allowed.includes(m[1]))tokens.push(m[1]);}
    const proofs=unique(tokens),peak=direct||leader?'':main.length===1?main[0]:proofs.length===1?proofs[0]:proofs.length>1?'':allowed.includes(raw)?raw:'';
    const abode=text(n.居所)||(!allowed.includes(raw)&&/居|院|宿舍|洞府|小筑|寓所|房/.test(raw)?raw:'');
    return {身份:r,峰脉:peak,居所:abode,归属:leader?'宗门直属':direct?'宗主门下':peak||'峰脉待核对',师承:direct?'宗主真传':r==='峰主真传'?'峰主真传':text(n.师承)||'普通师承',宗主真传身份:direct||leader&&n.宗主真传身份===true};
  }
  function stamp(y,m,d,h=9,min=0){if(!Number.isInteger(y)||y<1||y>275000)return null;const t=new Date(0);t.setUTCFullYear(y,m-1,d);t.setUTCHours(h,min,0,0);return t.getUTCFullYear()===y&&t.getUTCMonth()===m-1&&t.getUTCDate()===d&&h>=0&&h<24&&min>=0&&min<60?t.getTime():null;}
  function parseDate(value){const t=text(value),m=t.match(/(?:^|[^\d])(\d{1,6})年\D*?(\d{1,2})月\D*?(\d{1,2})日(?:\D*?(\d{1,2})(?:点|时|:|：)(\d{1,2})?(?:分)?)?/);if(!m)return null;const phase=t.match(/([丑寅卯辰巳午未申酉戌亥子])时/),hour=m[4]!==undefined?+m[4]:phase?('丑寅卯辰巳午未申酉戌亥子'.indexOf(phase[1])*2+1)%24:9;return stamp(+m[1],+m[2],+m[3],hour,+(m[5]||0));}
  function formatDate(ms){if(!Number.isFinite(ms))return '时间待核对';const t=new Date(ms);return `元会历${t.getUTCFullYear()}年${t.getUTCMonth()+1}月${t.getUTCDate()}日${String(t.getUTCHours()).padStart(2,'0')}点${String(t.getUTCMinutes()).padStart(2,'0')}分`;}
  const day=86400000;
  function addMonths(ms,n){const t=new Date(ms),wanted=t.getUTCDate(),target=new Date(0);target.setUTCFullYear(t.getUTCFullYear(),t.getUTCMonth()+n,1);target.setUTCHours(t.getUTCHours(),t.getUTCMinutes(),0,0);const end=new Date(target);end.setUTCMonth(end.getUTCMonth()+1,0);target.setUTCDate(Math.min(wanted,end.getUTCDate()));return target.getTime();}
  const T=(typeof createShushanTimeline==='function'?createShushanTimeline:require('./timeline.cjs').createShushanTimeline)({C,parseDate,formatDate,addMonths});
  const calendars=s=>T.upcoming(s);
  const eligible=(s)=>{const p=profile(s),r=realm(s),rank=C.rank(s,ext(s)),n=C.obj(ext(s).名籍),out=[];
    const push=(id,目标身份,目标,最低境界)=>out.push({id,目标身份,目标,最低境界});
    if(rank===1&&r>=3)push('内门','内门弟子','领取并完成一项符合当前境界与地点的外勤任务，回报任务堂后由内务堂核准晋升。',3);
    if(rank===2&&r>=4&&p.峰脉)push('峰主真传','峰主真传','完成所属峰主亲授的一项任务，得到峰主收徒许可并办理师承登记。',4);
    if(rank>=2&&rank<4&&r>=6)push('长老','长老','完成一项宗门职事任务，由宗主核验履历、正式任命并完成职务交接。',6);
    if(rank===4&&r>=6)push('大长老','大长老','完成一项统筹宗门的职事任务，取得长老议事认可及宗主任命，完成交接。',6);
    if(p.宗主真传身份&&rank<6&&r>=7)push('宗主常规继任','宗主','大乘已具承继资格，免额外试炼；与师尊及苏清雪确认承继安排，正式完成授印交接。',7);
    if(rank===5&&r>=7&&(n.宗主指定继任===true||n.宗主无法执掌===true&&n.真传不足接任===true))push('宗主特殊继任','宗主','以大乘大长老身份，经现任宗主明确指定，或在宗主无法执掌且真传不足接任时完成宗门承认与交接。',7);
    return out;
  };
  function promotions(s){
    const p=profile(s),rank=C.rank(s,ext(s)),r=realm(s),ready=eligible(s),out=[];
    const add=(id,target,min,needs)=>out.push({id,目标身份:target,最低境界:min,要求:needs,可接取:ready.some(e=>e.id===id)});
    if(rank===0)add('外门','外门弟子',1,'筑基即自动登记外门，无需任务。');
    if(rank===1)add('内门','内门弟子',3,'元婴起；完成一项外勤，回报任务堂并获内务堂核准。');
    if(rank===1&&C.collection(ext(s),'活动记录').some(([,e])=>e.名称==='新生大比'&&e.确认参加===true&&e.优胜确认===true))out.push({id:'新生破格内门',目标身份:'内门弟子 · 新生破格',最低境界:0,要求:'新生大比实际优胜已确认，领取内务堂的破格落籍任务，不受常规元婴门槛。',可接取:true});
    if(rank===2)add('峰主真传','峰主真传',4,'化神起；峰脉已确认，完成峰主亲授任务，取得收徒许可。');
    if(rank>=2&&rank<4)add('长老','长老',6,'合体起；完成宗门职事任务，取得宗主任命并交接。');
    if(rank===4)add('大长老','大长老',6,'合体起；完成统筹职事，长老议事认可、宗主任命并交接。');
    if(p.宗主真传身份&&rank<6)add('宗主常规继任','宗主',7,'大乘后免额外试炼，依既有真传序列确认承继并完成授印交接。');
    else if(rank===5)add('宗主特殊继任','宗主',7,'大乘；宗主指定，或宗主无法执掌且真传尚不足接任；须宗门认可与正式交接。');
    return out;
  }
  function prepare(data){
    const next=C.clone(data),s=next.stat_data;if(!C.member(s)||!s.蜀山剑门)return {changed:false,data:next};
    const x=s.蜀山剑门,before=JSON.stringify(x);x.名籍=C.obj(x.名籍);
    if(C.rank(s,x)===0&&realm(s)>=1){x.名籍.峰脉=profile(s).峰脉;s.主角.宗门='蜀山剑门外门弟子';x.名籍.身份='外门弟子';}
    const p=profile(s);x.名籍.峰脉=p.峰脉;x.名籍.居所=p.居所;
    if(p.身份!=='身份待核对')x.名籍.身份=p.身份;
    if(p.身份==='宗主真传')x.名籍.宗主真传身份=true;
    for(const name of ['岁序','活动记录','政务申请','峰脉名录','日程','日程标记'])if(!C.own(x,name))x[name]={};
    if(!C.own(x,'任职'))x.任职={};
    T.normalize(s);
    for(const [id,rec]of C.collection(x,'活动记录'))if(['内门考核','峰主真传遴选'].includes(rec.名称)&&!['已完成','已结束','已取消'].includes(rec.状态)){rec.状态='已取消';rec.说明='晋升改为名籍任务制，此旧比试安排已撤销。';for(const [,q]of C.collection(x,'剑札'))if(q.类型==='活动'&&q.活动编号===id&&['待接取','进行中','待结算'].includes(q.状态))q.状态='已取消';}
    const now=parseDate(s.世界?.当前时间);
    if(x.岁序.基准年!==3727)x.岁序.基准年=3727;
    if(now!==null&&!x.岁序.首次记录时间)x.岁序.首次记录时间=formatDate(now);
    for(const e of calendars(s)){const rec=x.活动记录[e.id];if(rec&&!['已完成','已结束'].includes(rec.状态)){rec.开始=e.开始;rec.结束=e.结束;if(rec.状态==='已错过'&&now<e.结束值)rec.状态=rec.确认参加?'已报名':'报名待确认';}}
    if(now!==null){
      for(const [,record]of C.collection(x,'活动记录')){const end=parseDate(record.结束);if(end!==null&&now>=end&&!['已完成','已结束','已错过'].includes(record.状态))record.状态=record.报名?'待核对结果':'已错过';}
      x.岁序.最近核对时间=s.世界.当前时间;
    }
    for(const [,q]of C.collection(x,'剑札'))if(q.类型==='晋升'&&!q._已结算&&q._晋升目标==='外门'&&['待接取','进行中','待结算'].includes(q.状态)){q.状态='已取消';q.进度='杂役筑基自动登记外门，此旧考察已撤销。';}
    for(const [,q]of C.collection(x,'剑札'))if(q.类型==='晋升'&&!q._已结算&&['待接取','进行中','待结算'].includes(q.状态)){if(q._晋升目标==='内门'&&/三年考核|特许考核/.test(q.目标||''))q.目标='完成一项符合当前境界与地点的外勤任务，回报任务堂后由内务堂核准晋升。';if(q._晋升目标==='峰主真传'&&!q._考察峰脉&&p.峰脉)q._考察峰脉=p.峰脉;}
    const work=C.obj(x.任职);
    if(work.部门&&DEPTS.some(d=>d.名称===work.部门)&&work.状态==='在任'&&C.rank(s,x)>=2&&now!==null){
      const t=new Date(now),id='职事-'+work.部门+'-'+t.getUTCFullYear()+'-'+(t.getUTCMonth()+1);
      const duty=DUTIES[work.部门];if(!C.collection(x,'剑札').some(([,q])=>q.部门===work.部门&&['待接取','进行中','待结算'].includes(q.状态)))x.剑札[id]??={名称:work.部门+' · '+duty[0],类型:'部门',部门:work.部门,目标:duty[1],状态:'待接取',奖励贡献:30};
    }
    for(const [id,a]of C.collection(x,'政务申请'))if(a.状态==='已批准'&&!a._已办理){
      const v=C.obj(a._凭据);if(v.类型==='入司'){
        if(C.rank(s,x)<2||!DEPTS.some(d=>d.名称===v.对象))continue;
        const post=text(a.结果?.职务)||'协办';if(!['协办','执事','主事'].includes(post)||realm(s)<4&&post!=='协办')continue;
        if(x.任职?.状态==='在任'&&x.任职.部门!==v.对象&&a.结果?.交接完成!==true)continue;
        x.任职={部门:v.对象,职务:post,状态:'在任',任职时间:text(s.世界?.当前时间)};a.状态='已完成';a._已办理=true;
      }else if(v.类型==='离任'&&x.任职.部门===v.对象){x.任职={};a.状态='已完成';a._已办理=true;}
    }
    return {changed:before!==JSON.stringify(x),data:next};
  }
  function request(data,type,id,values={}){
    const next=C.clone(data),s=next.stat_data;if(!C.member(s))throw new Error('尚未正式加入蜀山。');const x=ext(s);
    if(type==='晋升'){
      const exceptional=id==='新生破格内门'&&C.rank(s,x)===1&&C.collection(x,'活动记录').some(([,e])=>e.名称==='新生大比'&&e.确认参加===true&&e.优胜确认===true),rule=eligible(s).find(e=>e.id===id)||(exceptional?{目标身份:'内门弟子',目标:'凭本届大比优胜结果完成内务堂的破格晋升确认。'}:null);if(!rule)throw new Error('晋升所需境界或身份条件尚未满足。');
      const live=C.collection(x,'剑札').find(([,q])=>q.类型==='晋升'&&q._晋升目标===id&&['待接取','进行中','待结算'].includes(q.状态));
      if(live){if(live[1].状态!=='待接取')throw new Error('已接取这条晋升任务，请先处理在办事务。');live[1].状态='进行中';live[1]._接取时间=text(s.世界?.当前时间);x.追踪剑札=live[0];return next;}
      const base='晋升-'+id;let qid=base,n=1;while(C.own(x.剑札,qid))qid=base+'-再议'+n++;
      x.剑札[qid]={名称:rule.目标身份+(rule.目标身份==='宗主'?'承继交接':'晋升任务'),类型:'晋升',目标:rule.目标,状态:'进行中',奖励贡献:0,_接取时间:text(s.世界?.当前时间),_晋升目标:id,_目标身份:rule.目标身份,...(exceptional?{活动编号:C.collection(x,'活动记录').find(([,e])=>e.名称==='新生大比'&&e.确认参加===true&&e.优胜确认===true)[0]}:{}),...(id==='峰主真传'?{_考察峰脉:profile(s).峰脉}:{})};x.追踪剑札=qid;return next;
    }
    if(type==='活动报名'){
      const event=calendars(s).find(e=>e.id===id);if(!event||!['报名中','进行中'].includes(event.状态))throw new Error('此活动尚未开放报名或已经结束。');
      if(event.名称==='内门考核'&&(C.rank(s,x)!==1||realm(s)<3))throw new Error('常规内门考核须外门身份且元婴起。');
      if(x.活动记录[id]?.报名)throw new Error('已经提交过该届活动的报名。');
      x.活动记录[id]={名称:event.名称,开始:event.开始,结束:event.结束,状态:'报名待确认',报名:true,确认参加:false};
      x.剑札['活动-'+id]??={名称:event.名称+'参会安排',类型:'活动',目标:'先由主事确认报名与参会资格，再依实际活动安排完成；不默认取得名次或奖励。',活动编号:id,状态:'待接取',奖励贡献:0};return next;
    }
    if(type==='入司'&& (C.rank(s,x)<2||!DEPTS.some(d=>d.名称===id)))throw new Error('正式内门及以上方可申请部门任职。');
    if(type==='入司'&&x.任职?.部门===id&&x.任职.状态==='在任')throw new Error('已经在该部门任职。');
    if(type==='离任'&&x.任职?.部门!==id)throw new Error('当前不在此部门任职。');
    if(type==='开峰'){
      if(realm(s)<5)throw new Error('炼虚起方可申请开峰。');
      if(!text(s.主角.姓名))throw new Error('请先核对名籍姓名，再申请开峰。');
      const name=text(values.名称);if(!/^[\u3400-\u9fffA-Za-z0-9·]{1,20}峰$/.test(name)||PEAKS.includes(name)||name==='主峰'||registered(s).includes(name))throw new Error('请填写未被使用、以“峰”结尾的新峰名。');
      if(!text(values.方向)||!text(values.选址))throw new Error('请填写传承方向与拟议选址。');
      if(C.collection(x,'峰脉名录').some(([,p])=>p.峰主===s.主角.姓名&&p.状态==='已立峰'))throw new Error('已有自立峰，请先处理既有峰务。');
      const qid='开峰-'+name;if(C.own(x.剑札,qid))throw new Error('已有同名开峰任务。');
      x.剑札[qid]={名称:'筹立'+name,类型:'开峰',目标:'取得宗主许可，落实灵脉与资源、布置护峰阵法，完成传承规划和正式立峰仪式。',状态:'待接取',奖励贡献:0,_开峰方案:{名称:name,方向:text(values.方向),选址:text(values.选址)}};return next;
    }
    if(!['入司','离任'].includes(type))throw new Error('未知政务申请。');
    const rid=type+'-'+id;if(['待确认','已批准'].includes(x.政务申请[rid]?.状态))throw new Error('已经有相应申请待处理。');
    x.政务申请[rid]={状态:'待确认',申请时间:text(s.世界?.当前时间),_凭据:{类型:type,对象:id},结果:{}};return next;
  }
  function settleTask(data,id){
    const s=data.stat_data,x=ext(s),q=x.剑札?.[id];if(!q||!['晋升','开峰'].includes(q.类型))return C.settleTask(data,id);
    if(q._已结算||q.状态!=='待结算')return {changed:false,data:C.clone(data)};
    if(!q._接取时间||!text(q.批准人)||!text(q.完成依据))throw new Error('需要接取经历、批准人和实际完成依据后才能确认身份或开峰。');
    const next=C.clone(data),ns=next.stat_data,nx=ext(ns),nq=nx.剑札[id];
    if(q.类型==='晋升'){
      const id=q._晋升目标,rule=eligible(s).find(r=>r.id===id);
      const exceptional=id==='新生破格内门'&&q.活动编号&&x.活动记录[q.活动编号]?.名称==='新生大比'&&x.活动记录[q.活动编号]?.确认参加===true&&x.活动记录[q.活动编号]?.优胜确认===true&&C.rank(s,x)===1;
      const target=exceptional?'内门弟子':rule?.目标身份;
      if(!target||q.晋升确认!==true||q._目标身份!==target)throw new Error('晋升条件或正式批准尚未确认。');
      if(id==='内门'&&q.外勤完成!==true)throw new Error('外勤任务尚未完成并回报核准。');
      if(id==='峰主真传'&&(q.峰主任务完成!==true||q.峰主许可!==true||q._考察峰脉&&q._考察峰脉!==profile(s).峰脉))throw new Error('尚需完成所属峰主任务并取得收徒许可。');
      if(['长老','大长老'].includes(id)&&(q.职事任务完成!==true||q.宗主任命!==true||id==='大长老'&&q.长老议事认可!==true))throw new Error('职事任务、议事认可或宗主任命尚未落实。');
      if(target==='宗主'&&q.交接确认!==true)throw new Error('宗主继任须明确完成交接。');
      if(profile(s).宗主真传身份)nx.名籍.宗主真传身份=true;
      ns.主角.宗门='蜀山剑门'+target;nx.名籍.身份=target;
      if(['宗主真传','长老','大长老','宗主'].includes(target))nx.名籍.峰脉='';
      const p=profile(ns);nx.名籍.峰脉=p.峰脉;nq._晋升已办理=true;
    }else{
      const p=C.obj(q._开峰方案);
      if(realm(s)<5||q.开峰确认!==true||q.宗主许可!==true||q.灵脉落实!==true||q.资源落实!==true||q.护峰阵法完成!==true)throw new Error('开峰尚需炼虚修为及许可、灵脉、资源、阵法全部落实。');
      if(!/峰$/.test(p.名称||'')||PEAKS.includes(p.名称)||registered(s).includes(p.名称))throw new Error('峰名无效或已登记。');
      nx.峰脉名录[id]={名称:p.名称,传承方向:p.方向,选址:p.选址,峰主:ns.主角.姓名,状态:'已立峰',宗门认可:true,成立时间:text(ns.世界?.当前时间),弟子:{},设施:{},招生:{状态:'尚未启动'}};nx.名籍.自立峰=id;
    }
    return C.settleTask(next,id);
  }
  function breakthrough(data){
    const next=C.clone(data),s=next.stat_data,x=ext(s);let changed=false;
    for(const [id,e]of C.collection(x,'活动记录'))if(e.名称==='新生大比'&&e.确认参加===true&&e.优胜确认===true&&C.rank(s,x)===1){const qid='晋升-新生破格内门';if(!C.own(x.剑札,qid)){x.剑札[qid]={名称:'新生大比破格入内门',类型:'晋升',目标:'凭本届大比优胜结果完成内务堂的破格晋升确认。',状态:'待接取',奖励贡献:0,活动编号:id,_晋升目标:'新生破格内门',_目标身份:'内门弟子'};changed=true;}}
    return {changed,data:next};
  }
  function tokens(s,page=''){
    if(!C.member(s))return [];const p=profile(s),x=ext(s),out=['⟦蜀山扩展正式身份⟧'];
    if(PEAKS.includes(p.峰脉))out.push('⟦蜀山归属:'+p.峰脉+'⟧');
    if(p.归属==='宗主门下'||p.归属==='宗门直属'||/主峰|擎天剑霄殿/.test(text(s.世界?.当前地点)))out.push('⟦蜀山归属:主峰⟧');
    if(page==='calendar'||calendars(s).some(e=>['报名中','进行中'].includes(e.状态))||C.collection(x,'活动记录').some(([,e])=>!['已结束','已完成','已错过'].includes(e.状态)))out.push('⟦蜀山模块:岁序⟧');
    if(page==='departments'||x.任职?.部门||C.collection(x,'政务申请').some(([,a])=>['待确认','已批准'].includes(a.状态)))out.push('⟦蜀山模块:职事⟧');
    if(page==='governance'||realm(s)>=5||C.rank(s,x)>=4)out.push('⟦蜀山模块:开峰⟧');
    if(page==='promotion'||eligible(s).length||C.rank(s,x)>=4&&C.rank(s,x)<6||C.collection(x,'剑札').some(([,q])=>q.类型==='晋升'&&['待接取','进行中','待结算'].includes(q.状态)))out.push('⟦蜀山模块:晋升⟧');
    if(page==='merit'||C.collection(x,'办理').some(([,r])=>['待确认','已批准'].includes(r.状态)))out.push('⟦蜀山模块:办理⟧');
    return out;
  }
  function summary(s){const x=ext(s),p=profile(s),due=calendars(s).filter(e=>['报名中','进行中'].includes(e.状态)).slice(0,8).map(e=>({id:e.id,名称:e.名称,状态:e.状态,开始:e.开始})),pending=C.collection(x,'政务申请').filter(([,a])=>['待确认','已批准'].includes(a.状态)),tasks=C.collection(x,'剑札').filter(([,q])=>['晋升','开峰'].includes(q.类型)&&q.状态==='待接取'),events=C.collection(x,'活动记录').filter(([,e])=>!['已结束','已完成','已错过'].includes(e.状态));return '\n【名籍核对】'+JSON.stringify(p)+'\n【当期岁序】'+JSON.stringify(due)+'\n【任职与政务申请】'+JSON.stringify({任职:x.任职||{},申请:Object.fromEntries(pending)})+'\n【活动报名】'+JSON.stringify(Object.fromEntries(events))+'\n【成长待接剑札】'+JSON.stringify(Object.fromEntries(tasks))+'\n【自立峰】'+JSON.stringify(C.collection(x,'峰脉名录').map(([id,p])=>({id,名称:p.名称,峰主:p.峰主,状态:p.状态})))+'\n政务申请只由AI批准，脚本办理。晋升/开峰任务请补批准人、完成依据及相应确认字段，脚本统一结算。峰脉不得填写居所；非所属六峰不常驻注入。';}
  return {PEAKS,REALMS,DEPTS,realm,profile,registered,parseDate,formatDate,addMonths,calendars,eventsBetween:T.between,timelineRules:T.RULES,eligible,promotions,prepare,request,settleTask,breakthrough,tokens,summary};
}

function createShushanAgenda(C,G){
  'use strict';
  const DAY=86400000,closed=v=>['已完成','已结束','已取消','放弃','失败','失效','已归档'].includes(v),text=v=>C.str(v).trim();
  const key=(t,id)=>t+':'+id;
  function parse(v){const t=text(v),m=t.match(/^(\d{1,6})-(\d\d)-(\d\d)(?:T(\d\d):(\d\d))?$/);return m?G.parseDate(`${+m[1]}年${+m[2]}月${+m[3]}日${m[4]||'00'}点${m[5]||'00'}分`):G.parseDate(t);}
  function midnight(ms){const t=new Date(ms);t.setUTCHours(0,0,0,0);return t.getTime();}
  function dateKey(ms){const t=new Date(ms);return `${t.getUTCFullYear()}-${String(t.getUTCMonth()+1).padStart(2,'0')}-${String(t.getUTCDate()).padStart(2,'0')}`;}
  const monthKey=ms=>dateKey(ms).split('-').slice(0,2).join('-');
  function monthInfo(s,value){const now=parse(s.世界?.当前时间),chosen=value?parse(value+'-01'):now;if(now===null||chosen===null)return null;const t=new Date(chosen);t.setUTCDate(1);const start=midnight(t.getTime()),grid=start-((t.getUTCDay()+6)%7)*DAY;return {year:t.getUTCFullYear(),month:t.getUTCMonth()+1,key:monthKey(start),start,grid,end:grid+42*DAY,today:dateKey(now)};}
  function clock(value){const t=text(value),m=t.match(/(?:^|\D)(\d{1,2})[:：点时](\d{1,2})?/);if(m&&+m[1]<24&&+(m[2]||0)<60)return +m[1]*60+ +(m[2]||0);const i='丑寅卯辰巳午未申酉戌亥子'.indexOf(t[0]);return i>=0?((i*2+1)%24)*60:null;}
  function windowOf(o){const raw=o.开始||o.日期||o.时间||o.截止时间||o.时限||'',phase=/[丑寅卯辰巳午未申酉戌亥子]时/.test(raw);let a=parse(raw);const b=parse(o.结束);if(a===null)return null;const timed=o.全天!==true&&(phase||/(?:点|时\d|[:：]|T\d)/.test(raw));if(!timed)a=midnight(a);const end=b!==null?b:(timed?a+(phase?2:1)*3600000:midnight(a)+DAY);return end>a?{start:a,end}:null;}
  function occurrences(o,from,to,legacyDaily=false){
    const base=windowOf(o),period=text(o.周期),daily=period==='每日'||legacyDaily&&!period,monthly=period==='每月',weekly=period==='每周';
    if(!daily&&!monthly&&!weekly)return base?[base]:[];
    const startBound=parse(o.起始日期||o.开始),stopBound=parse(o.终止日期),minutes=clock(o.时辰||o.时间),days=Array.isArray(o.每月日)?o.每月日:base?[new Date(base.start).getUTCDate()]:[],week=Array.isArray(o.星期)?o.星期:[];
    const out=[];
    for(let d=midnight(from);d<to;d+=DAY){const t=new Date(d);if(startBound!==null&&d+DAY<=startBound||stopBound!==null&&d>stopBound)continue;if(monthly&&!days.includes(t.getUTCDate())||weekly&&!week.includes((t.getUTCDay()+6)%7+1))continue;const start=d+(minutes===null?0:minutes*60000);out.push({start,end:minutes===null?d+DAY:start+2*3600000});}
    return out;
  }
  function collect(s,from,to){
    if(!C.member(s))return {rows:[],undated:[],archived:[],overdue:[]};const x=C.extension(s),rows=[],undated=[],archived=[],overdue=[],flags=C.obj(x.日程标记),linked=new Set(),now=parse(s.世界?.当前时间);
    const push=(e)=>{const visible=e.start===null||e.start<to&&e.end>from,flag=flags[e.id];if(flag?.状态){const marked=parse(flag.记录时间);if(visible||marked!==null&&marked>=from&&marked<to)archived.push({...e,标记:flag.状态});return;}if(e.completed)return;if(e.start!==null&&e.end<=now&&(e.task||e.note&&!e.repeat)){e.overdue=true;overdue.push(e);}if(e.start===null)undated.push(e);else if(visible)rows.push(e);};
    const make=(type,id,title,desc,span,extra={})=>({id:key(type,id),类别:type,来源编号:id,标题:title||id,说明:desc||'',start:span?.start??null,end:span?.end??null,...extra});
    for(const e of G.eventsBetween(s,from,to))push(make('宗门',e.id,e.名称,e.说明,{start:e.开始值,end:e.结束值},{event:e,重要:true,completed:closed(x.活动记录?.[e.id]?.状态)}));
    for(const [id,q]of C.collection(x,'剑札')){linked.add(q.关联机遇||q.名称||id);if(['进行中','待结算'].includes(q.状态))push(make(q.类型==='部门'?'职事':'剑札',id,q.名称,q.目标||q.说明,windowOf(q),{task:id}));}
    for(const [id,c]of C.collection(x,'课业')){if(closed(c.状态)||c.状态==='暂停')continue;const spans=occurrences(c,from,to,/晨课|每日|日课/.test(c.性质||''));if(!spans.length&&!['每日','每周','每月'].includes(c.周期))push(make('课业',id,c.名称,c.说明,null));for(const span of spans)push(make('课业',id+'@'+dateKey(span.start),c.名称,c.说明,span,{来源编号:id,repeat:!!c.周期||/晨课|每日|日课/.test(c.性质||'')}));}
    for(const id of x.我的雅集||[]){const g=x.雅集?.[id];if(!g)continue;const joined=C.collection(x,'办理').filter(([,r])=>r.状态==='已完成'&&['入社','建社'].includes(r._凭证?.类型)&&r._凭证?.对象===id).map(([,r])=>parse(r.完成时间)).filter(t=>t!==null),known=parse(g.加入时间),start=joined.length?Math.max(...joined):known!==null?known:midnight(now),template={周期:'每月',每月日:Array.isArray(g.会日)?g.会日:[5,15,25],时辰:g.会时||''};for(const span of occurrences(template,from,to)){if(start!==null&&span.end<=start)continue;push(make('雅集',id+'@'+dateKey(span.start),(g.名称||id)+' · 会日',g.会时?'与同门按约相聚。':'会日已记，具体时辰可向同门问询。',span,{来源编号:id,repeat:true,重要:true,club:id}));}const act=C.obj(g.活动),span=windowOf({...act,开始:act.开始||act.时间,结束:act.结束});if(act.标题&&span)push(make('雅集',id+'-邀约-'+dateKey(span.start),act.标题,act.说明,span,{来源编号:id,club:id}));}
    for(const [id,n]of C.collection(x,'日程')){if(n.来源类型==='机遇'&&n.来源编号)linked.add(n.来源编号);if(closed(n.状态))continue;const type=['机遇','约定','记事','职事','课业'].includes(n.类别)?n.类别:'记事';const spans=occurrences(n,from,to),repeat=['每日','每月','每周'].includes(n.周期);if(!spans.length&&!repeat)push(make(type,'记-'+id,n.标题||n.名称,n.说明,null,{note:id}));for(const span of spans)push(make(type,'记-'+id+(repeat?'@'+dateKey(span.start):''),n.标题||n.名称,n.说明,span,{note:id,repeat,重要:n.重要===true}));}
    for(const [id,o]of C.collection(s,'机遇'))if(!linked.has(id)&&!closed(o.状态))push(make('机遇',id,id,o.目标||o.引言,null,{opportunity:id}));
    const activeIds=new Set([...rows,...undated,...archived].map(e=>e.id));for(const [id,f]of C.collection(x,'日程标记'))if(f.状态&&!activeIds.has(id)&&(f.start===null||f.start<to&&f.end>from||parse(f.记录时间)>=from&&parse(f.记录时间)<to))archived.push({...f,id,标记:f.状态});
    const sort=(a,b)=>(a.start??Infinity)-(b.start??Infinity)||a.标题.localeCompare(b.标题,'zh-CN');return {rows:rows.sort(sort),undated:undated.sort(sort),archived:archived.sort(sort),overdue:overdue.sort(sort)};
  }
  function add(data,id,values){const d=C.clone(data),s=d.stat_data;if(!C.member(s))throw new Error('正式入门后方可记事。');const x=C.extension(s);x.日程??={};if(!C.safe(id)||C.own(x.日程,id))throw new Error('请重新记下这件事。');const title=text(values.标题);if(!title||title.length>80)throw new Error('请填写八十字以内的事项名称。');const start=values.开始?parse(values.开始):null,end=values.结束?parse(values.结束):null;if(values.开始&&start===null||values.结束&&end===null||end!==null&&(start===null||end<start))throw new Error('请核对起止日期。');if(values.周期&&values.周期!=='一次'&&start===null)throw new Error('固定会期需要先选一个日期。');x.日程[id]={标题:title,类别:values.类别||'记事',说明:text(values.说明),全天:true,状态:'进行中',周期:values.周期||'一次',重要:values.重要===true,...(start!==null?{开始:G.formatDate(start),...(end!==null?(values.周期&&values.周期!=='一次'?{终止日期:G.formatDate(midnight(end)+DAY-1)}:{结束:G.formatDate(midnight(end)+DAY)}):{})}:{}),记录时间:text(s.世界?.当前时间)};return d;}
  function mark(data,e,state){const d=C.clone(data),s=d.stat_data;if(!C.member(s)||!e?.id||!['已办','收起','恢复'].includes(state))throw new Error('这条日程已变化，请重新查看。');const x=C.extension(s);x.日程标记??={};if(state==='恢复')delete x.日程标记[e.id];else x.日程标记[e.id]={标题:e.标题,类别:e.类别,来源编号:e.来源编号,start:e.start,end:e.end,repeat:!!e.repeat,状态:state,记录时间:text(s.世界?.当前时间)};return d;}
  function summary(s){const now=parse(s.世界?.当前时间);if(!C.member(s)||now===null)return '';const a=collect(s,midnight(now),midnight(now)+7*DAY),seen=new Set(),rows=a.rows.filter(e=>{const key=e.类别+':'+e.来源编号;if(seen.has(key))return false;seen.add(key);return true;});return '\n【近七日与待排期日程】'+JSON.stringify({日期:G.formatDate(now),事项:rows.slice(0,24).map(e=>({编号:e.id,标题:e.标题,类别:e.类别,开始:G.formatDate(e.start),结束:G.formatDate(e.end)})),待回报:a.overdue.slice(0,12).map(e=>({编号:e.id,标题:e.标题,原期:G.formatDate(e.end)})),待排期:a.undated.slice(0,12).map(e=>({编号:e.id,标题:e.标题,类别:e.类别}))})+'\n日历勾销仅收起提醒，不代替真实任务结算。玩家主动触发的机遇、约定、课业请按已知日期登记日程；未知日期留待排期，不编造截止时间。技术编号与字段不写入叙事正文。';}
  return {DAY,parse,midnight,dateKey,monthKey,monthInfo,collect,add,mark,summary};
}

function createShushanUpdater(C){
  'use strict';
  const ROOT='蜀山剑门',MODES=['body','extra','api'],danger=new Set(['__proto__','prototype','constructor']);
  function config(value={},fallback='body'){
    return {mode:MODES.includes(value.mode)?value.mode:fallback,url:C.str(value.url).trim(),key:C.str(value.key),model:C.str(value.model).trim(),tokens:Math.max(256,Math.min(16000,Math.floor(Number(value.tokens)||4000))),automatic:value.automatic!==false};
  }
  function validate(value){const s=config(value);if(s.mode==='api'){let url;try{url=new URL(s.url);}catch{throw new Error('请填写完整的 API 地址。');}if(!['https:','http:'].includes(url.protocol)||url.username||url.password)throw new Error('API 地址须为 HTTP 或 HTTPS，密钥请单独填写。');if(!s.model)throw new Error('请填写模型名称。');}return s;}
  const channel=m=>m==='body'?'正文':m==='extra'?'额外解析':'独立API';
  function instruction(mode,extra){
    const active=mode==='body'?!extra:mode==='extra'?extra:false;
    return active?'【蜀山更新通道='+channel(mode)+'】本次负责蜀山扩展更新，只改实际发生的扩展字段，保留已接任务与只读凭据。沿用原卡唯一变量区，在 Analysis 保留通道标记；如已有变量区则合并其中，原卡变量仍按原方式更新。格式为：<UpdateVariable><Analysis>蜀山更新通道='+channel(mode)+'</Analysis><JSONPatch>[]</JSONPatch></UpdateVariable>，数组内填写真实变化，无变化用空数组。':'【蜀山更新分工】本次只演绎正文或更新原卡变量，不在 JSONPatch 中更新 /蜀山剑门；蜀山扩展由所选通道另行记录。原卡自己的变量更新照常。';
  }
  function blocks(text){const out=[];for(const m of String(text||'').matchAll(/<UpdateVariable\b[^>]*>([\s\S]*?)<\/UpdateVariable\s*>/gi)){const patches=[];for(const p of m[1].matchAll(/<JSON_?Patch\b[^>]*>([\s\S]*?)<\/JSON_?Patch\s*>/gi)){const a=JSON.parse(p[1].trim().replace(/^```(?:json)?\s*|\s*```$/g,''));if(!Array.isArray(a))throw new Error('变量更新应为 JSONPatch 数组。');patches.push(...a);}out.push({text:m[1],patches});}return out;}
  function extract(text,mode='api',legacyBody=false){
    if(String(text||'').length>1000000)throw new Error('本次变量回复过长，请缩短后重试。');
    const rows=blocks(text),tag='蜀山更新通道='+channel(mode);
    if(rows.length){const tagged=rows.filter(b=>b.text.includes(tag)),fallback=mode==='api'?rows:legacyBody&&mode==='body'&&rows.length===1&&!rows[0].text.includes('蜀山更新通道=额外解析')?rows:legacyBody&&mode==='extra'&&!rows.at(-1).text.includes('蜀山更新通道=正文')?[rows.at(-1)]:[];return (tagged.length?tagged:fallback).flatMap(b=>b.patches);}
    if(mode!=='api')return [];
    let raw=String(text||'').trim().replace(/^```(?:json)?\s*|\s*```$/g,'');const data=JSON.parse(raw);const result=Array.isArray(data)?data:data.json_patch;if(!Array.isArray(result))throw new Error('独立更新须返回 JSONPatch 数组。');return result;
  }
  function parts(path){if(typeof path!=='string'||!path.startsWith('/'+ROOT+'/'))throw new Error('更新只能写入蜀山扩展自己的字段。');const a=path.slice(1).split('/').map(v=>v.replace(/~1/g,'/').replace(/~0/g,'~'));if(a.some(v=>!v||danger.has(v)||v.startsWith('_')))throw new Error('更新不能改写脚本凭据或使用无效字段。');return a;}
  function safeValue(value){if(value&&typeof value==='object'){for(const [k,v]of Object.entries(value)){if(danger.has(k)||k.startsWith('_'))throw new Error('模型不能新增或重写脚本凭据。');safeValue(v);}}}
  function apply(data,operations,strict=true){
    if(!C.member(data?.stat_data))throw new Error('当前未正式加入蜀山。');if(!Array.isArray(operations)||operations.length>200)throw new Error('本次变量操作数量异常。');
    const next=C.clone(data),s=next.stat_data;let count=0;
    for(const o of operations){if(!o||typeof o!=='object')throw new Error('变量操作格式不正确。');if(!String(o.path||'').startsWith('/'+ROOT+'/')){if(strict)throw new Error('独立更新不能改写原卡变量。');continue;}
      const a=parts(o.path);if(a.length<3&&a[1]!=='追踪剑札')throw new Error('请逐项更新，不能替换整个扩展集合。');
      let parent=s;for(const key of a.slice(0,-1)){if(!Object.hasOwn(parent,key)||!parent[key]||typeof parent[key]!=='object')throw new Error('更新路径的父级尚未建立，请先逐层添加。');parent=parent[key];}
      const key=a.at(-1),exists=Object.hasOwn(parent,key),array=Array.isArray(parent),index=key==='-'?parent.length:Number(key);if(array&&!(key==='-'||/^\d+$/.test(key)&&index<=parent.length))throw new Error('数组下标无效。');
      if(['add','insert','replace'].includes(o.op)){safeValue(o.value);if(o.value===undefined)throw new Error('更新缺少 value。');if(o.op==='replace'&&!exists)throw new Error('要替换的字段不存在。');if(exists&&parent[key]&&typeof parent[key]==='object'){
        const protectedKeys=Object.keys(parent[key]).filter(k=>k.startsWith('_'));if(protectedKeys.some(k=>JSON.stringify(parent[key][k])!==JSON.stringify(o.value?.[k])))throw new Error('不能用整条替换清除既有脚本凭据，请逐字段更新。');
      }if(array&&o.op!=='replace')parent.splice(index,0,C.clone(o.value));else parent[key]=C.clone(o.value);}
      else if(o.op==='remove'){if(!exists)throw new Error('要移除的字段不存在。');if(parent[key]&&typeof parent[key]==='object'&&Object.keys(parent[key]).some(k=>k.startsWith('_')))throw new Error('不能删除已办理或已接取的完整记录。');if(array)parent.splice(index,1);else delete parent[key];}
      else if(o.op==='delta'){if(!exists||!Number.isFinite(parent[key])||!Number.isFinite(o.value))throw new Error('增量更新需要数字字段。');parent[key]+=o.value;}
      else throw new Error('仅支持 add、insert、replace、remove 与 delta 操作。');count++;
    }
    return {data:next,count,changed:JSON.stringify(data.stat_data[ROOT])!==JSON.stringify(s[ROOT])};
  }
  function ownCommand(c){
    let p=String(c?.args?.[0]??'').trim().replace(/^['"`]|['"`]$/g,'');
    if(p===ROOT||p.startsWith(ROOT+'.')||p.startsWith(ROOT+'[')||p.startsWith('/'+ROOT))return true;
    return !p&&['insert','assign'].includes(c.type)&&String(c.args?.[1]??'').replace(/^['"`]|['"`]$/g,'')===ROOT;
  }
  function applyOnce(data,operations,scope,strict=true){
    const old=data?.stat_data?.[ROOT]?._更新凭据,seen=old?.楼层===scope&&Array.isArray(old.操作)?old.操作:[],signature=o=>{const t=JSON.stringify(o);let h=2166136261;for(const ch of t){h^=ch.codePointAt(0);h=Math.imul(h,16777619);}return (h>>>0).toString(36);};
    if(!Array.isArray(operations)||operations.length>200)throw new Error('本次变量操作数量异常。');
    const wanted=operations.filter(o=>!seen.includes(signature(o))),plan=apply(data,wanted,strict);
    if(plan.count){plan.data.stat_data[ROOT]._更新凭据={楼层:scope,操作:[...new Set([...seen,...wanted.map(signature)])].slice(-600)};plan.changed=true;}
    return plan;
  }
  function filter(commands){
    if(!Array.isArray(commands))return;
    for(let i=commands.length-1;i>=0;i--)if(ownCommand(commands[i]))commands.splice(i,1);
  }
  function request(settings,s,messages,rules,generationId){
    const c=validate(settings);if(c.mode!=='api')throw new Error('当前未选择独立 API。');
    const history=messages.filter(m=>['assistant','user'].includes(m.role)&&!m.is_hidden).slice(-6).map(m=>({role:m.role,content:String(m.message||'').replace(/<UpdateVariable\b[^>]*>[\s\S]*?<\/UpdateVariable>/gi,'').slice(-10000)}));
    const state={世界:s.世界,主角:{姓名:s.主角?.姓名,宗门:s.主角?.宗门,境界:s.主角?.境界,宗门贡献:s.主角?.宗门贡献},蜀山剑门:s[ROOT]};
    const x=s[ROOT],r=typeof rules==='string'?rules:[rules.base,rules.calendar,...(C.collection(x,'剑札').some(([,q])=>q.类型==='晋升'&&['进行中','待结算'].includes(q.状态))?[rules.growth]:[]),...(x.任职?.部门||C.collection(x,'政务申请').length?[rules.department]:[]),...(C.collection(x,'剑札').some(([,q])=>q.类型==='开峰')||C.collection(x,'峰脉名录').length?[rules.peak]:[]),...(C.collection(x,'办理').some(([,q])=>['待确认','已批准'].includes(q.状态))?[rules.trade]:[])].filter(Boolean).join('\n');
    return {generation_id:generationId,should_stream:false,max_chat_history:0,custom_api:{apiurl:c.url,key:c.key,model:c.model,source:'openai',max_tokens:c.tokens,temperature:0.3},ordered_prompts:[{role:'system',content:'你只负责依据已发生剧情维护蜀山扩展资料。输出 JSONPatch 数组；没有变化输出 []。只允许 /蜀山剑门/集合/条目 及其子字段。不能改原卡变量、不能改任何下划线凭据、不能清空集合或已接任务，不推进剧情、不新增未经演绎的交易或奖励。以当前状态为准，只写必要差异。'+r},{role:'user',content:'当前状态：'+JSON.stringify(state)+'\n最近剧情：'+JSON.stringify(history)}]};
  }
  return {config,validate,channel,instruction,extract,apply,applyOnce,ownCommand,filter,request};
}

function createShushanRewind(C){
  'use strict';
  const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b),root=data=>data?.stat_data?.蜀山剑门;
  function point(previous,data,scope){
    if(previous?.scope===scope&&same(previous.head,root(data)))return C.clone(previous);
    return {scope,baseline:C.clone(root(data)),head:C.clone(root(data)),drafts:[]};
  }
  function record(previous,before,after,scope){
    // Only local panel operations are reversible; original-card data is never restored.
    if(!same(before.stat_data.主角,after.stat_data.主角)||!same(before.stat_data.世界,after.stat_data.世界))return null;
    const saved=point(previous,before,scope);saved.head=C.clone(root(after));return saved;
  }
  function draft(previous,data,scope,before,after,details){
    const saved=point(previous,data,scope);
    saved.drafts.push({before,after,receipt:details?.类型==='办理'?details.编号:null});
    return saved;
  }
  function restore(saved,data,scope){
    if(!saved||saved.scope!==scope)return {changed:false,data,message:'本楼尚无可撤回的面板操作。已有待办可在对应页面撤回申请。'};
    if(!same(saved.head,root(data)))throw new Error('本楼记录已被剧情或其他更新改变，不能用旧初态覆盖。待确认申请仍可单独撤回。');
    const next=C.clone(data);next.stat_data.蜀山剑门=C.clone(saved.baseline);
    if(next.display_data&&C.own(next.display_data,'蜀山剑门'))next.display_data.蜀山剑门=C.clone(saved.baseline);
    if(next.delta_data)delete next.delta_data.蜀山剑门;
    return {changed:!same(root(data),root(next)),data:next,drafts:saved.drafts||[],message:'已恢复本楼更新后的初态，撤回了本楼的面板操作。'};
  }
  function cleanDraft(value,entries){
    let text=value,retained=false;
    for(const item of [...entries].reverse()){
      if(text===item.after)text=item.before;
      else if(text.startsWith(item.after))text=item.before+text.slice(item.after.length);
      else if(item.after.startsWith(item.before)&&text.endsWith(item.after.slice(item.before.length)))text=text.slice(0,text.length-(item.after.length-item.before.length));
      else retained=true;
    }
    return {text,retained};
  }
  return {same,point,record,draft,restore,cleanDraft};
}

function renderShushanCalendar({C,G,A,s,ui,E,br,button,heading,empty}){
  const m=A.monthInfo(s,ui.calendarMonth);if(!m)return '<div class="sa-content">'+heading('宗门岁序 · 日历','且候时序明','待记清年月，再约下一程。')+empty('当前年月尚待核对。')+'</div>';
  const x=C.extension(s),a=A.collect(s,m.grid,m.end),all=[...a.rows,...a.undated,...a.archived,...a.overdue];ui.agendaRows=Object.fromEntries(all.map(e=>[e.id,e]));
  if(!ui.calendarDay||A.parse(ui.calendarDay)<m.grid||A.parse(ui.calendarDay)>=m.end)ui.calendarDay=m.today.startsWith(m.key)?m.today:m.key+'-01';
  const selected=A.parse(ui.calendarDay),mode=ui.calendarMode||'当日',daily=a.rows.filter(e=>e.start<selected+A.DAY&&e.end>selected),items=mode==='待排期'?a.undated:mode==='已勾销'?a.archived:[...new Map([...(ui.calendarDay===m.today?a.overdue:[]),...daily].map(e=>[e.id,e])).values()];
  const note=ui.calendarForm||{},label=d=>{const t=new Date(d);return `${t.getUTCFullYear()}年${t.getUTCMonth()+1}月${t.getUTCDate()}日`;};
  const itemView=e=>{
    let actions='';const arc=mode==='已勾销';
    if(arc)actions=button('恢复提醒','cal-mark',{id:e.id,state:'恢复'});
    else{
      if(e.event){const r=x.活动记录?.[e.event.id],can=['报名中','进行中'].includes(e.event.状态)&&!r?.报名;actions=button(r?.报名?'已递名帖':e.event.名称==='宗门招收季'?'递帖协助迎新':'递交报名帖','growth',{type:'活动报名',id:e.event.id},true,!can)+button('问询安排','ask',{text:'我想了解这一届「'+e.标题+'」的安排，向主事问清何时到场、需要准备些什么。',event:e.event.id,start:e.event.开始,end:e.event.结束});}
      else if(e.task)actions=button('回报进展','progress',{id:e.task});
      else actions=button(e.club?'问询赴会':'问询此事','ask',{text:e.club?'我想与「'+(x.雅集?.[e.club]?.名称||e.标题)+'」的同门相约赴会，先问清时辰与地点。':'我想继续处理「'+e.标题+'」这件事，先确认当前进展与安排。'});
      actions+=button('勾销本次','cal-mark',{id:e.id,state:'已办'})+button('收起提醒','cal-mark',{id:e.id,state:'收起'});
    }
    return '<article class="sa-agenda-item"><div class="sa-news-meta"><span>'+E(e.类别)+(e.repeat?' · 固定会期':'')+'</span><span>'+E(arc?e.标记:e.overdue?'已过约期 · 待回报':e.event?.状态||'')+'</span></div><h4>'+E(e.标题)+'</h4><p>'+br(e.说明)+'</p>'+(e.start!==null?'<p class="sa-quiet-note">'+E(G.formatDate(e.start))+' — '+E(G.formatDate(e.end))+'</p>':'<p class="sa-quiet-note">尚未约定日期</p>')+'<div class="sa-actions">'+actions+'</div></article>';
  };
  const cells=[];for(let i=0;i<42;i++){const start=m.grid+i*A.DAY,d=A.dateKey(start),events=a.rows.filter(e=>e.start<start+A.DAY&&e.end>start);cells.push('<button type="button" class="sa-calendar-day cursor-interaction '+(!d.startsWith(m.key+'-')?'sa-other-month ':'')+(d===m.today?'sa-is-today':'')+'" data-action="cal-day" data-id="'+d+'" aria-pressed="'+(d===ui.calendarDay)+'" aria-label="'+E(label(start)+(events.length?'，'+events.length+'项：'+events.map(e=>e.标题).join('、'):'，暂无事项'))+'"><span class="sa-day-number">'+new Date(start).getUTCDate()+(d===m.today?'<small>今</small>':'')+'</span><span class="sa-day-events">'+events.slice(0,2).map(e=>'<span class="sa-day-event" data-kind="'+E(e.类别)+'">'+E(e.标题)+'</span>').join('')+(events.length>2?'<span class="sa-more-events">另 '+(events.length-2)+' 项</span>':'')+'</span><span class="sa-day-dots" aria-hidden="true">'+events.slice(0,4).map(e=>'<i data-kind="'+E(e.类别)+'"></i>').join('')+'</span></button>');}
  const form=ui.calendarAdding?'<section class="sa-calendar-add"><h4>记一桩事</h4><div class="sa-form-grid"><label class="sa-field sa-field-wide">事项<input data-calendar-field="标题" maxlength="80" required value="'+E(note.标题)+'"></label><label class="sa-field">类别<select data-calendar-field="类别">'+['记事','约定','机遇','职事','课业'].map(v=>'<option '+(note.类别===v?'selected':'')+'>'+v+'</option>').join('')+'</select></label><label class="sa-field">会期<select data-calendar-field="周期">'+['一次','每日','每月'].map(v=>'<option '+(note.周期===v?'selected':'')+'>'+v+'</option>').join('')+'</select></label><label class="sa-field">日期<input type="date" data-calendar-field="开始" value="'+E(note.开始)+'"></label><label class="sa-field">至<input type="date" data-calendar-field="结束" value="'+E(note.结束)+'"></label><label class="sa-field sa-field-wide">备注<textarea data-calendar-field="说明" maxlength="500">'+E(note.说明)+'</textarea></label></div><p class="sa-quiet-note">不填日期则暂记待排期；固定会期只勾销当次，下次仍会提醒。</p><div class="sa-actions">'+button('记入日历','cal-add',{},true)+button('暂不记','cal-form',{id:'close'})+'</div></section>':'';
  return '<div class="sa-content">'+heading('宗门岁序 · 修行日历','一页记山中','将来日约在纸上，把此心留与长风。','<div class="sa-living-date"><span>'+E(s.世界?.当前时间||'')+'</span><small>随剧情年月推移</small></div>')+'<div class="sa-calendar-toolbar"><div class="sa-calendar-month"><h4>元会历 '+m.year+' 年 '+String(m.month).padStart(2,'0')+' 月</h4><div class="sa-actions">'+button('上月','cal-month',{id:-1},false,m.year===1&&m.month===1)+button('本月','cal-month',{id:'today'})+button('下月','cal-month',{id:1},false,m.year>=275000&&m.month===12)+'</div></div>'+button('记一桩事','cal-form',{id:'open'},true)+'</div><div class="sa-calendar-week" aria-hidden="true">'+['一','二','三','四','五','六','日'].map(d=>'<span>'+d+'</span>').join('')+'</div><div class="sa-calendar-grid" aria-label="修行月历">'+cells.join('')+'</div><div class="sa-calendar-legend"><span>宗门会期</span><span>剑札与职事</span><span>课业与雅集</span><span>机遇与记事</span></div>'+form+'<div class="sa-task-filters">'+['当日','待排期','已勾销'].map(v=>'<button type="button" class="sa-filter cursor-interaction" data-action="cal-mode" data-id="'+v+'" aria-pressed="'+(mode===v)+'">'+v+(v==='待排期'?' '+a.undated.length:v==='已勾销'?' '+a.archived.length:'')+'</button>').join('')+'</div><h4 class="sa-agenda-heading">'+E(mode==='当日'?label(selected):mode==='待排期'?'且待约期':'已勾销的提醒')+'</h4><div class="sa-agenda-list">'+(items.map(itemView).join('')||empty(mode==='当日'?'这一日暂无安排。':mode==='待排期'?'暂无待排期事项。':'尚无勾销记录。'))+'</div><p class="sa-quiet-note">剧情确认完成后自动收起。手动勾销只收起这次提醒；任务交接、贡献与所得仍按实际进度办理。</p></div>';
}

async function runShushan(CSS,GROUPS,UPDATER_RULES){
  'use strict';
  const C=createShushanCore(),G=createShushanGrowth(C),A=createShushanAgenda(C,G),U=createShushanUpdater(C),R=createShushanRewind(C),host=window.parent||window,doc=host.document,KEY='__shushan_dispose';
  if(typeof host[KEY]==='function')host[KEY]();
  const api=name=>{for(const owner of [window,window.TavernHelper,host.TavernHelper])if(typeof owner?.[name]==='function')return owner[name].bind(owner);const f=host.TavernHelper?._bind?.['_'+name];return typeof f==='function'?f.bind(window):undefined;};
  const health={phase:'starting',member:false,detail:'等待酒馆助手与 MVU',chatId:'',messageId:null,sect:null};host.__shushan_health=health;
  let stopped=false,queue=Promise.resolve(),timer,busy=false,mvuBusy=false,mvuWithReply=false,writing=false,current=null,key='',mount=null,shadow=null,signature='',injection=null,sharedMvu=null;
  const stops=[],ui={page:'identity',open:true,tasks:'进行中',clubs:'结识雅集',club:null,creating:false,service:'藏经阁',category:'全部',notice:'',stamp:null,form:{名称:'',简介:'',场所:''},peakForm:{名称:'',方向:'',选址:''}};
  const E=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const br=v=>E(v).replace(/\n/g,'<br>'),list=(x,k)=>C.collection(x,k),num=n=>String(Number.isFinite(n)?n:0);
  const pages=[['identity','弟子名籍'],['tasks','师门剑札'],['practice','今日修行'],['merit','功德传承'],['news','山门拾闻'],['clubs','同门雅集']];
  function visiblePages(){return [...pages,['calendar','宗门岁序'],['departments','百司职事'],['governance','掌峰议事']];}
  function pageAllowed(id){const {s,x}=stats();return id==='departments'?C.rank(s,x)>=2:id==='governance'?G.realm(s)>=5||C.rank(s,x)>=4:true;}
  const button=(label,action,values={},primary=false,disabled=false)=>'<button type="button" class="sa-button cursor-interaction '+(primary?'sa-button-primary':'')+'" data-action="'+action+'" '+Object.entries(values).map(([k,v])=>'data-'+k+'="'+E(v)+'"').join(' ')+' '+(disabled?'disabled':'')+'>'+E(label)+'</button>';
  const heading=(tag,title,poem,right='')=>'<header class="sa-page-head"><div><div class="sa-eyebrow">'+E(tag)+'</div><h3>'+E(title)+'</h3><p>'+E(poem)+'</p></div>'+right+'</header>';
  const empty=(message,ask='')=>'<div class="sa-task-empty"><p>'+E(message)+'</p>'+(ask?button('问询此事','ask',{text:ask}):'')+'</div>';
  const localId=prefix=>prefix+'-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8);
  const hash=s=>{let h=2166136261;for(const ch of String(s)){h^=ch.codePointAt(0);h=Math.imul(h,16777619);}return (h>>>0).toString(36);};
  let panelAction=false;
  const checkpoints=host.__shushan_panel_checkpoints??=new Map();
  const checkpointKey=info=>'shushan-panel-reset:'+hash(info?.ctx.key||'');
  function checkpoint(info){
    if(!info?.data?.stat_data?.蜀山剑门)return null;
    const name=checkpointKey(info);let saved=checkpoints.get(name);
    if(!saved)try{saved=JSON.parse(host.localStorage.getItem(name)||'null');}catch{}
    return saved?.scope===info.fingerprint?saved:null;
  }
  function saveCheckpoint(info,saved){
    const name=checkpointKey(info);
    if(saved)checkpoints.set(name,saved);else checkpoints.delete(name);
    while(checkpoints.size>12)checkpoints.delete(checkpoints.keys().next().value);
    try{if(saved)host.localStorage.setItem(name,JSON.stringify(saved));else host.localStorage.removeItem(name);}catch{}
  }
  function cleanDraft(entries){
    const input=doc.querySelector('#send_textarea');if(!input)return false;
    const result=R.cleanDraft(input.value,entries);if(result.text!==input.value){input.value=result.text;input.dispatchEvent(new host.Event('input',{bubbles:true}));}return result.retained;
  }
  async function resetFloor(){
    if(isBusy()||updating)throw new Error('请等本楼回复与资料更新结束，再恢复初态。');
    const info=read(),saved=checkpoint(info);if(!info?.data)return;
    const plan=R.restore(saved,info.data,info.fingerprint);
    if(plan.changed)await write(data=>R.restore(saved,data,info.fingerprint).data);
    if(read()?.fingerprint!==info.fingerprint)throw new Error('聊天或回复分支已切换，未清理当前输入框。');
    const retained=cleanDraft(plan.drafts||[]);saveCheckpoint(info,null);
    Object.assign(ui,{open:true,intent:null,stamp:null,creating:false,promotionOpen:false,settingsOpen:false,settingsDraft:null,calendarAdding:false,calendarForm:{},form:{名称:'',简介:'',场所:''},peakForm:{名称:'',方向:'',选址:''}});
    ui.notice=plan.message+(retained?' 手动改写过的草稿已保留，请自行核对。':'');
    await refresh();
  }
  function context(){const ctx=(window.SillyTavern||host.SillyTavern)?.getContext?.();return {ctx,key:String(ctx?.getCurrentChatId?.()??ctx?.chatId??ctx?.characters?.[ctx?.characterId]?.chat??'')};}
  const M=()=>sharedMvu||window.Mvu||host.Mvu;
  const settingsKey='shushan-update-settings';
  function nativeMode(){return (context().ctx?.extensionSettings||host.SillyTavern?.extensionSettings)?.mvu_settings?.更新方式;}
  let settings=U.config({},nativeMode()==='额外模型解析'?'extra':'body');
  try{settings=U.config(JSON.parse(host.localStorage.getItem(settingsKey)||'{}'),settings.mode);}catch{}
  let pendingUpdate=null,updating=null,updateSerial=0,lastUpdateFingerprint='';
  function updateToken(info){if(!info)return '';const story=String(info.last.message||'').replace(/<UpdateVariable\b[^>]*>[\s\S]*?<\/UpdateVariable>/gi,'');let own='';if(settings.mode!=='api')try{own=JSON.stringify(U.extract(info.last.message,settings.mode,settings.mode==='body'?nativeMode()!=='额外模型解析':nativeMode()==='额外模型解析'));}catch{}return info.fingerprint.split('|').slice(0,3).join('|')+'|'+hash(story+'|'+own);}
  function cancelUpdate(){updateSerial++;updating?.cancel?.();if(updating?.id)Promise.resolve(api('stopGenerationById')?.(updating.id)).catch(()=>{});updating=null;pendingUpdate=null;health.update={mode:settings.mode,state:'空闲'};}
  function queueUpdate(force=false){const info=read();if(!info?.data||!C.member(info.data.stat_data)||!force&&settings.mode==='api'&&!settings.automatic)return;const token=updateToken(info);if(!force&&token===lastUpdateFingerprint)return;pendingUpdate={token,force};schedule(250);}
  async function updateOwn(){
    if(!pendingUpdate||updating||isBusy())return;
    const job=pendingUpdate;pendingUpdate=null;const before=read();if(!before?.data||!C.member(before.data.stat_data)||updateToken(before)!==job.token||!job.force&&job.token===lastUpdateFingerprint)return;
    const mode=settings.mode;
    const serial=++updateSerial,id='shushan-update-'+serial+'-'+Date.now(),original=JSON.stringify(before.data.stat_data.蜀山剑门);updating={id,serial};health.update={mode,state:mode==='api'?'请求中':mode==='extra'?'读取额外解析':'读取正文'};render();
    try{
      let text=before.last.message;
      if(mode==='api'){const generate=api('generateRaw');if(!generate)throw new Error('当前酒馆助手未提供独立请求接口。');const canceled=new Promise((_,reject)=>{updating.cancel=()=>reject(new Error('本次更新已取消。'));});text=await Promise.race([generate(U.request(settings,before.data.stat_data,before.messages,UPDATER_RULES,id)),canceled]);if(typeof text!=='string')throw new Error('独立 API 未返回可解析文本。');}
      if(stopped||serial!==updateSerial||mode!==settings.mode)return;
      const fresh=read();if(fresh?.fingerprint!==before.fingerprint||JSON.stringify(fresh.data?.stat_data?.蜀山剑门)!==original)throw new Error('聊天、分支或蜀山记录已变化，本次更新未写入；可在设置中重新更新。');
      const ops=U.extract(text,mode,mode==='body'?nativeMode()!=='额外模型解析':nativeMode()==='额外模型解析'),scope=fresh.fingerprint.split('|').slice(0,3).join('|'),plan=U.applyOnce(fresh.data,ops,scope,mode==='api');
      if(plan.changed)await write(data=>U.applyOnce(data,ops,scope,mode==='api').data);
      lastUpdateFingerprint=job.token;health.update={mode,state:'已更新',operations:plan.count};if(job.force)ui.notice=plan.count?'当前楼层的蜀山记录已核对。':'本次没有需要更新的蜀山记录。';
    }catch(error){if(stopped||serial!==updateSerial)return;health.update={mode,state:'未写入',reason:mode==='api'?'请检查 API 配置、返回格式或当前分支。':error.message};ui.notice=mode==='api'?'蜀山独立更新未写入，请检查 API 配置或返回格式；原卡变量不受影响。':error.message;}
    finally{if(serial===updateSerial){updating=null;current=read();render();injectState(current);}}
  }
  function liveGeneration(){
    if(doc.body?.dataset.generating==='true')return true;
    const stop=doc.getElementById('mes_stop');
    if(!stop)return null;
    const style=host.getComputedStyle(stop);return !stop.hidden&&style.display!=='none'&&style.visibility!=='hidden'&&stop.getClientRects().length>0;
  }
  function activity(){
    const live=liveGeneration(),extra=!!M()?.isDuringExtraAnalysis?.();
    if(live===false&&(busy||mvuWithReply)&&!extra){mvuBusy=false;mvuWithReply=false;}
    if(live!==null)busy=live;
    return health.activity={reply:busy,variables:mvuBusy,extraAnalysis:extra};
  }
  const isBusy=()=>Object.values(activity()).some(Boolean);
  function read(){
    const ctx=context();if(!ctx.key)return null;
    const messages=api('getChatMessages')('0-{{lastMessageId}}',{hide_state:'all'}),last=[...messages].reverse().find(m=>m.role==='assistant'&&!m.is_hidden);
    if(!last)return null;
    const full=api('getChatMessages')(last.message_id,{include_swipes:true})[0]||last;
    const data=M()?.getMvuData?.({type:'message',message_id:last.message_id});
    if(!data?.stat_data?.主角)return {ctx,messages,last,data:null,fingerprint:ctx.key+'|'+last.message_id+'|'+(full.swipe_id??'')+'|'+hash(last.message)};
    return {ctx,messages,last,data,fingerprint:ctx.key+'|'+last.message_id+'|'+(full.swipe_id??'')+'|'+hash(last.message)};
  }
  function stopInjection(){try{injection?.uninject?.();api('uninjectPrompts')?.(['shushan-state','shushan-activation','shushan-route-body','shushan-route-extra']);}catch{}injection=null;}
  function remove(){mount?.remove();mount=null;shadow=null;signature='';for(const el of doc.querySelectorAll('[data-shushan-frontend]'))el.remove();}
  function schedule(delay=120){clearTimeout(timer);timer=setTimeout(()=>enqueue(()=>refresh()).catch(()=>{}),delay);}
  function enqueue(fn){const result=queue.then(()=>!stopped&&fn());queue=result.catch(error=>{console.error('[蜀山剑门]',error);health.detail=error.message;if(current&&C.member(current.data?.stat_data)){ui.notice=error.message;render();}});return result;}
  function notify(text){ui.notice=text;render();}
  async function write(transform){
    if(isBusy())throw new Error('请等当前回复与变量更新结束后再操作。');
    const fresh=read();if(!fresh?.data||!C.member(fresh.data.stat_data))throw new Error('当前蜀山身份尚未确认。');
    const before=C.clone(fresh.data),after=transform(C.clone(before));if(!after)return;
    const check=read();if(check?.fingerprint!==fresh.fingerprint)throw new Error('聊天或回复分支已切换，本次操作未写入。');
    writing=true;
    try{
      await M().replaceMvuData(after,{type:'message',message_id:fresh.last.message_id});
      const saved=read();if(saved?.fingerprint!==fresh.fingerprint)return;
      if(JSON.stringify(saved.data?.stat_data?.蜀山剑门)!==JSON.stringify(after.stat_data.蜀山剑门)||JSON.stringify(saved.data?.stat_data?.主角)!==JSON.stringify(after.stat_data.主角))throw new Error('变量尚未确认保存，请检查助手与 MVU 日志后重试。');
      current=saved;api('eventEmit')?.('daoyuan_mvu_manual_updated');
      const origin=checkpoint(fresh);
      if(panelAction&&!updating)saveCheckpoint(saved,R.record(origin,before,after,fresh.fingerprint));
      else if(origin&&!R.same(before.stat_data.蜀山剑门,after.stat_data.蜀山剑门))saveCheckpoint(saved,null);
    }finally{writing=false;}
  }
  function fill(text,details){if(details)ui.intent={chat:key,text,details};const input=doc.querySelector('#send_textarea');if(!input)throw new Error('未找到聊天输入框。');const before=input.value;input.value=input.value.trim()?input.value.trim()+'\n'+text:text;const info=read();if(info?.data?.stat_data?.蜀山剑门&&!isBusy()&&!updating)saveCheckpoint(info,R.draft(checkpoint(info),info.data,info.fingerprint,before,input.value,details));input.dispatchEvent(new host.Event('input',{bubbles:true}));input.focus();ui.notice='行动已填入聊天输入框，发送后由剧情确认。';render();injectState(current);}
  function voluntary(messages){
    const text=[...messages].reverse().find(m=>m.role==='user')?.message||'';
    if(/(?:不想|不要|不愿|不打算|不会|拒绝|取消|放弃|不加入|不拜入|不入门|不拜师|不报名).{0,12}(?:加入|拜入|蜀山)/.test(text)||/蜀山剑门.{0,12}(?:不加入|不拜入|不入门|不拜师|不报名|不想加入)/.test(text))return false;
    return /(?:我想|我要|我决定|申请|报名|拜入|加入|开局|出生|出身).{0,45}蜀山剑门|蜀山剑门.{0,20}(?:入门|拜师|报名|开局|出身)/.test(text);
  }
  function injectState(info){
    stopInjection();if(!info?.data)return;
    const member=C.member(info.data.stat_data);
    if(member){const s=info.data.stat_data,tokens=G.tokens(s,ui.promotionOpen?'promotion':ui.page);const user=[...info.messages].reverse().find(m=>m.role==='user')?.message||'';if(/(?:介绍|总览|了解|比较).{0,12}(?:六峰|各峰|分峰)/.test(user))tokens.push('⟦蜀山模块:分峰总览⟧');if(/主峰|擎天剑霄殿/.test(user)&&!tokens.includes('⟦蜀山归属:主峰⟧'))tokens.push('⟦蜀山归属:主峰⟧');injection=api('injectPrompts')([{id:'shushan-activation',position:'none',depth:0,role:'system',content:tokens.join('\n'),should_scan:true},{id:'shushan-state',position:'in_chat',depth:1,role:'system',content:C.summary(s)+G.summary(s)+A.summary(s)+(ui.intent?.chat===key&&(user.includes(ui.intent.text)||doc.querySelector('#send_textarea')?.value.includes(ui.intent.text))?'\n【本次界面行动后台凭据】'+JSON.stringify(ui.intent.details):''),should_scan:false},...['body','extra'].map(phase=>({id:'shushan-route-'+phase,position:'in_chat',depth:0,role:'system',content:U.instruction(settings.mode,phase==='extra'),should_scan:false,filter:()=>!!M()?.isDuringExtraAnalysis?.()===(phase==='extra')}))]);}
    else if(voluntary(info.messages))injection=api('injectPrompts')([{id:'shushan-activation',position:'none',depth:0,role:'system',content:'⟦蜀山扩展自愿入门⟧',should_scan:true}]);
  }
  async function refresh(force=false){
    activity();
    if(stopped||writing||busy&&!force)return;
    const info=read();if(info?.ctx.key!==key){cancelUpdate();key=info?.ctx.key||'';lastUpdateFingerprint=updateToken(info);remove();stopInjection();Object.assign(ui,{page:'identity',open:true,promotionOpen:false,settingsOpen:false,settingsDraft:null,club:null,creating:false,notice:'',stamp:null,calendarMonth:null,calendarDay:null,calendarMode:'当日',calendarAdding:false,calendarForm:{},intent:null,form:{名称:'',简介:'',场所:''}});}
    current=info;health.chatId=info?.ctx.key||'';health.messageId=info?.last.message_id??null;health.sect=info?.data?.stat_data?.主角?.宗门??null;
    if(!info?.data){health.member=false;remove();stopInjection();health.phase=info?'waiting-variables':'waiting-chat';health.detail=info?'当前 AI 楼层尚未取得主角变量':'等待当前聊天与 AI 楼层';return;}
    if(!C.member(info.data.stat_data)){cancelUpdate();health.member=false;remove();injectState(info);health.phase='idle';health.detail='当前宗门未满足正式蜀山身份，保持隐藏';return;}
    health.member=true;
    const seed=C.blank(info.data.stat_data,GROUPS),stored=info.data.stat_data.蜀山剑门;
    const missing=!stored||Object.keys(seed).some(field=>!C.own(stored,field));
    if(missing&&!busy&&!mvuBusy){
      await write(data=>{if(!data.stat_data.蜀山剑门)data.stat_data.蜀山剑门=seed;else{const existing=data.stat_data.蜀山剑门;if(typeof existing!=='object'||Array.isArray(existing))throw new Error('蜀山扩展数据应为对象，请先核对变量。');for(const [field,value]of Object.entries(seed))if(!C.own(existing,field))existing[field]=C.clone(value);}return data;});current=read();
    }
    if(!current?.data?.stat_data?.蜀山剑门){health.phase='waiting';return;}
    if(!isBusy())await write(data=>{const first=G.prepare(data),second=G.prepare(first.data),third=G.breakthrough(second.data);return first.changed||second.changed||third.changed?third.data:null;});
    injectState(current);render();health.phase='ready';health.detail='弟子令已连接当前分支';
    if(!busy&&!mvuBusy){
      const x=C.extension(current.data.stat_data);
      for(const [rid,r]of list(x,'办理'))if(r.状态==='已批准'){
        try{let label='';await write(data=>{const plan=C.settle(data,rid);label=plan.label;return plan.changed?plan.data:null;});if(label){ui.notice='「'+label+'」已办妥，贡献与所得已一并登记。';if(['入社','建社'].includes(r._凭证?.类型)){ui.page='clubs';ui.creating=false;ui.club=r._凭证.对象;ui.stamp={kind:'club',id:ui.club,until:Date.now()+1200};}}}
        catch(error){ui.notice='办理暂缓：'+error.message;console.warn('[蜀山剑门]',rid,error.message);}
      }
      const now=C.extension(current.data.stat_data);
      for(const [id,t]of list(now,'剑札'))if(['进行中','待结算'].includes(t.状态)&&!t._接取时间&&t.剧情接取时间){
        await write(data=>{data.stat_data.蜀山剑门.剑札[id]._接取时间=C.str(t.剧情接取时间);return data;});
      }
      for(const [id,t]of list(now,'剑札'))if(t.状态==='待结算'&&!t._已结算){
        try{await write(data=>{const plan=G.settleTask(data,id);return plan.changed?plan.data:null;});ui.notice=['晋升','开峰'].includes(t.类型)?'批准与交接已核对，名籍已登记。':'任务奖励已核算入宗门贡献。';}catch(error){ui.notice='结算暂缓：'+error.message;}
      }
      current=read();render();injectState(current);
    }
    await updateOwn();
  }
  function stats(){const s=current.data.stat_data;return {s,x:C.extension(s),p:s.主角,w:C.obj(s.世界)};}
  function promotionView(){
    const {s,x}=stats(),choices=G.promotions(s);
    return '<section class="sa-promotion" aria-label="晋升要求"><div class="sa-eyebrow">问道有阶 · 晋升要求</div>'+choices.map(p=>{const active=list(x,'剑札').find(([,q])=>q._晋升目标===p.id&&['进行中','待结算'].includes(q.状态));return '<article class="sa-promotion-row"><div><h4>'+E(p.目标身份)+'</h4><p>'+E(p.要求)+'</p><small>'+E(p.可接取?'当前条件已满足':p.id==='外门'?'达到筑基后自动登记':'当前尚待境界、归属或承继条件落实')+'</small></div>'+button(active?'查看在办':p.目标身份==='宗主'?'办理承继':'接取晋升任务',active?'promotion-task':'promote',{id:active?active[0]:p.id},p.可接取,!active&&(!p.可接取||p.id==='外门'))+'</article>';}).join('')+(choices.length?'':empty('此刻已无后续身份晋升，可继续经营宗门与峰中事务。'))+'<p class="sa-quiet-note">领取后先与主事确认具体任务，依实际经历回报；不会因点击而直接完成任务。新生大比优胜另有破格入内门通道。</p></section>';
  }
  function settingsView(){
    const d=ui.settingsDraft||settings;
    return '<section class="sa-settings" aria-label="更新设置"><div class="sa-eyebrow">弟子令 · 更新设置</div><div class="sa-form-grid"><label class="sa-field sa-field-wide">蜀山资料更新方式<select data-update-field="mode" aria-label="蜀山更新方式">'+[['body','随正文更新'],['extra','随原 MVU 额外变量解析'],['api','独立 API 更新']].map(([id,label])=>'<option value="'+id+'" '+(d.mode===id?'selected':'')+'>'+label+'</option>').join('')+'</select></label>'+(d.mode==='api'?'<label class="sa-field sa-field-wide">API 地址<input type="url" data-update-field="url" placeholder="https://example.com/v1" value="'+E(d.url)+'"></label><label class="sa-field">API 密钥<input type="password" autocomplete="off" data-update-field="key" value="'+E(d.key)+'"></label><label class="sa-field">模型名称<input data-update-field="model" value="'+E(d.model)+'"></label><label class="sa-field">最大回复长度<input type="number" min="256" max="16000" data-update-field="tokens" value="'+E(d.tokens)+'"></label><label class="sa-update-check"><input type="checkbox" data-update-field="automatic" '+(d.automatic?'checked':'')+'>每次新回复后自动更新蜀山资料</label>':'')+'</div><p class="sa-quiet-note">'+E(d.mode==='body'?'蜀山资料随正文中的变量区更新，不额外请求模型。':d.mode==='extra'?'需要在原 MVU 中开启额外变量解析，蜀山资料与原卡在同一次解析中更新。':'使用 OpenAI 兼容接口，只整理已经发生的蜀山剧情；自动更新会产生额外请求。API 配置只保存在本机，不进入聊天变量或提示词。')+'</p><div class="sa-actions">'+button('保存设置','settings-save',{},true)+(settings.mode!=='extra'?button('更新当前楼层','settings-update',{},false,!!updating):'')+(updating?button('取消本次更新','settings-cancel'):'')+button('关闭设置','settings-close')+'</div><p class="sa-quiet-note" role="status">当前：'+E(U.channel(settings.mode))+' · '+E(health.update?.state||'就绪')+'</p></section>';
  }
  function identity(){
    const {s,x,p}=stats(),n=C.obj(x.名籍),profile=G.profile(s),items=[['所属宗门',p.宗门],['弟子身份',profile.身份],['师门归属',profile.归属],['修行境界',p.境界||'待核对'],['灵根',typeof p.灵根==='string'?p.灵根:JSON.stringify(p.灵根||'待核对')],['居所',profile.居所||'待登记'],['师承',profile.身份==='宗主真传'?'白薇 · 宗主门下':n.师承||'待核对'],['宗门贡献',p.宗门贡献]];
    return '<div class="sa-content">'+heading('山门名籍 · 弟子令','此心已有归处','从今云外千重路，留取青山一姓名。','<span class="sa-page-number">籍</span>')+'<section class="sa-ledger" aria-label="弟子名籍"><div class="sa-jade-area"><div class="sa-jade-token" aria-hidden="true"><span>蜀山</span></div><span>青锋有主</span></div><div class="sa-ledger-fields"><h4>'+E(p.姓名||p.道号||'蜀山弟子')+'</h4><dl class="sa-facts">'+items.map(([k,v])=>'<div><dt>'+E(k)+'</dt><dd>'+E(v)+'</dd></div>').join('')+'</dl></div></section><p class="sa-background-note">'+E(n.简介||'白玉令记山门名籍，一柄剑伴此后长路。')+'</p><div class="sa-actions">'+button('核对名籍与居所','ask',{text:'请核对我在蜀山的身份、已确认峰脉、师承、居所与入门时间；峰脉只能写所属正式峰名，居所单独登记。未确认不猜测，不重复招生。'})+(profile.身份==='宗主真传'?button('递帖求见师尊','ask',{text:'我以宗主真传身份递帖求见师尊白薇，请按她当前闭关、职责和可见安排演绎；不默认随时打断闭关，不归入六峰。'}):'')+button('晋升','promotion',{},true)+'</div>'+(ui.promotionOpen?promotionView():'')+'</div>';
  }
  function taskView(){
    const {x}=stats(),tasks=list(x,'剑札'),status=ui.tasks;
    const visible=tasks.filter(([,t])=>status==='归档'?['已完成','失败','放弃','失效'].includes(t.状态):status==='进行中'?['进行中','待结算'].includes(t.状态):t.状态==='待接取');
    return '<div class="sa-content">'+heading('任务堂 · 剑札','此行有托','一纸山门托付，几程尘世修行。','<span class="sa-page-number">'+tasks.filter(([,t])=>['进行中','待结算'].includes(t.状态)).length+'<small style="font-size:12px"> 在办</small></span>')+'<div class="sa-task-filters">'+['进行中','待接取','归档'].map(t=>'<button type="button" class="sa-filter cursor-interaction" data-action="task-filter" data-id="'+t+'" aria-pressed="'+(t===status)+'">'+t+'</button>').join('')+'</div><div class="sa-tasks">'+(visible.map(([id,t])=>'<article class="sa-task" data-quest="'+E(id)+'"><div class="sa-task-top"><h4>'+E(t.名称||id)+'</h4><span class="sa-task-id">'+E(t.地点||t.状态)+'</span></div><p class="sa-task-desc">'+br(t.目标||t.说明)+'</p>'+(t.状态!=='待接取'?'<span class="sa-stamp" aria-label="'+E(t.状态)+'">'+(t.状态==='已完成'?'成':'受')+'</span>':'')+(t.进度?'<p class="sa-task-progress">'+br(t.进度)+'</p>':'')+'<div class="sa-task-bottom"><span class="sa-task-reward">'+E(t.时限||'依剧情安排')+' · '+(C.count(t.奖励贡献)?'完成可得 '+t.奖励贡献+' 功德':'奖励待核对')+'</span><div class="sa-task-actions">'+(t.状态==='待接取'?button('接取剑札','accept',{id},true):['进行中','待结算'].includes(t.状态)?button('核对进度','progress',{id})+button(x.追踪剑札===id?'当前追踪':'追踪此事','track',{id},false,x.追踪剑札===id)+button('商议放弃','ask',{text:'我想与任务堂商议放弃「'+(t.名称||id)+'」，请说明后果，在我明确确认后再变更任务状态。'}):'')+'</div></div></article>').join('')||empty('此刻暂无相应剑札。'))+'</div><div class="sa-actions">'+button('问询师门事务','ask',{text:'我想向任务堂问询适合当前身份、境界与地点的师门事务。请提供少量有明确目标、期限与宗门贡献奖励的剑札，录入蜀山剑门.剑札，保持已有进行中任务。'})+'</div></div>';
  }
  function practice(){const {x}=stats();return '<div class="sa-content">'+heading('教务堂 · 今日课业','松风磨剑','持一剑，稳一息，修行自在朝夕。')+list(x,'课业').map(([id,c])=>'<article class="sa-course"><div class="sa-course-time">'+E(c.时辰||'课')+'<small>'+E(c.性质||'依安排')+'</small></div><div><h4>'+E(c.名称||id)+'</h4><p>'+br(c.说明)+'<br>'+E(c.地点||'')+' '+E(c.条件||'')+'</p>'+button('问询赴课','ask',{text:'我想参加「'+(c.名称||id)+'」，请核对当前身份、剧情时间与地点后安排，不直接增加修为或功法熟练度。'})+'</div></article>').join('')+(list(x,'课业').length?'':empty('课业安排尚待教务堂核对。'))+button('问询近期课程','ask',{text:'请按我的蜀山身份、峰脉及当前剧情时间整理可参加的课业，写入蜀山剑门.课业。外门正式弟子保留晨课要求，内门自行安排，无我峰不套用固定课程。'})+'</div>';}
  function receiptView(){
    const {x}=stats();return list(x,'办理').slice().reverse().map(([id,r])=>{const p=C.obj(r._凭证);return '<article class="sa-task"><div class="sa-task-top"><h4>'+E(p.名称||id)+'</h4><span class="sa-badge">'+E(r.状态)+'</span></div><p>'+E(p.类型)+' · '+E(p.数量||1)+' '+(p.类型==='借阅'?'项 / '+E(p.天数)+'日':'份')+' · '+E(p.总价||0)+' 功德</p>'+(r.说明?'<p class="sa-task-desc">'+br(r.说明)+'</p>':'')+'<div class="sa-task-actions">'+(['待确认','已批准'].includes(r.状态)?button('重新填写请求','resume',{id})+button('撤销申请','cancel',{id}):'')+'</div></article>';}).join('')||empty('此刻没有办理记录。');
  }
  function merit(){
    const {s,x,p}=stats(),offers=list(x,'目录'),cat=ui.category;
    let body='';
    if(ui.service==='办理记录')body=receiptView();
    else{
      const source=offers.filter(([,o])=>ui.service==='藏经阁'?['借阅','传承'].includes(o.方式):o.方式==='兑换'),categories=['全部',...new Set(source.map(([,o])=>o.分类||'其他'))];
      if(!categories.includes(cat))ui.category='全部';
      body='<div class="sa-task-filters sa-categories">'+categories.map(kind=>'<button type="button" class="sa-filter cursor-interaction" data-action="category" data-id="'+E(kind)+'" aria-pressed="'+(ui.category===kind)+'">'+E(kind)+'</button>').join('')+'</div><div class="sa-library">'+source.filter(([,o])=>ui.category==='全部'||(o.分类||'其他')===ui.category).map(([id,o])=>{
        const allowed=C.permitted(s,x,o),known=C.count(o.单价),quantity=o.方式==='借阅'?'天数':'数量',max=o.方式==='借阅'?(o.层级==='内门'?3:o.层级==='地阶以上'?1:7):o.分类==='器物'||o.方式==='传承'?1:99;
        const pending=list(x,'办理').some(([,r])=>['待确认','已批准'].includes(r.状态)&&r._凭证?.对象===id);
        return '<article class="sa-tome '+(o.方式==='兑换'?'sa-exchange':'')+'"><div class="'+(o.方式==='兑换'?'sa-exchange-mark':'sa-tome-spine')+'">'+E(o.方式==='兑换'?({'器物':'器','丹药':'丹','材料':'材','符箓':'符'}[o.分类]||'物'):(o.分类||o.方式))+'</div><div><h4>'+E(o.名称||id)+'</h4><p>'+E(o.品阶||'')+' '+E(o.最低身份||'')+'<br>'+br(o.描述)+'<br><span class="sa-gold">'+(known?o.单价+' 功德 / '+(o.方式==='借阅'&&o.层级!=='地阶以上'?'日':o.单位||'次'):'报价待问询')+'</span>'+(C.count(o.库存)?' · 余 '+o.库存:'')+'</p>'+((o.方式==='借阅'||o.方式==='兑换')&&max>1?'<label class="sa-quantity">'+quantity+'<input aria-label="'+E(o.名称||id)+'的'+quantity+'" type="number" min="1" max="'+max+'" value="1" data-offer-quantity="'+E(id)+'"></label>':'')+button(pending?'已有待办':!allowed?'资格尚未满足':!known?'问询报价':o.方式==='借阅'?'申请借阅':o.方式==='传承'?'申请传承':'申请兑换',!known?'ask':'offer',!known?{text:'请核对「'+(o.名称||id)+'」的价格、身份要求与可办理数量，再更新目录条目，不直接扣款。'}:{id},true,!allowed||pending||o.库存===0)+(o.方式==='借阅'?'<p class="sa-quiet-note">借阅不等于习得，按剧情历法登记应还时间。</p>':'')+'</div></article>';
      }).join('')+'</div>';
      if(!source.length)body+=empty(ui.service==='藏经阁'?'可借阅与传承条目尚待核对。':'兑换目录尚待功德堂报价。');
      body+='<div class="sa-actions">'+button(ui.service==='藏经阁'?'问询藏经阁':'问询兑换物资','ask',{text:ui.service==='藏经阁'?'请按我的身份和蜀山藏经阁规则提供可借阅或可申请传承的功法，录入蜀山剑门.目录，明确层级、方式、日费、期限与特许条件，不把示例当成封闭目录。':'请按我的身份、境界和宗门贡献，向功德堂问询当前可兑换的器物、丹药、材料及其他合适物资。将明确报价、分类、库存、最低身份和说明录入蜀山剑门.目录，不直接扣款或发放。'})+'</div>';
    }
    const borrowed=list(x,'借阅').filter(([,b])=>b.状态==='借阅中');
    if(ui.service==='藏经阁'&&borrowed.length)body+='<section class="sa-borrowed"><h4>在借典籍</h4>'+borrowed.map(([id,b])=>'<div class="sa-borrow-row"><span>'+E(b.名称)+' · 应还 '+E(b.应还时间)+'</span>'+button('申请归还','return',{id})+'</div>').join('')+'</section>';
    return '<div class="sa-content">'+heading('功德传承 · 藏经阁与功德堂','寸功换青锋','一卷传心法，一物伴长行。','<span class="sa-page-number">'+num(p.宗门贡献)+'<small style="font-size:12px"> 功德</small></span>')+'<div class="sa-task-filters">'+['藏经阁','功德堂','办理记录'].map(t=>'<button type="button" class="sa-filter cursor-interaction" data-action="service" data-id="'+t+'" aria-pressed="'+(ui.service===t)+'">'+t+'</button>').join('')+'</div>'+body+'</div>';
  }
  function news(){const {x,w}=stats(),rows=list(x,'闻讯');return '<div class="sa-content">'+heading('山门拾闻 · 此间生活','山中有闲事','听几声松风，拾半日闲谈。','<div class="sa-living-date"><span>'+E(w.当前时间||'')+'</span></div>')+(rows.map(([id,n],i)=>'<article class="'+(i===0?'sa-news-feature':'sa-news-row')+'">'+(i?'<span class="sa-news-mark" aria-hidden="true">闻</span><div>':'')+'<div class="sa-news-meta"><span>'+E(n.类别||'山门小闻')+'</span><span>'+E(n.来源||'来源待核对')+' · '+E(n.性质||'传闻')+'</span></div><h4>'+E(n.标题||id)+'</h4><p>'+br(n.摘要)+'</p>'+(n.详情?'<details><summary>听听详情</summary><p>'+br(n.详情)+'</p></details>':'')+(i?'</div>':'')+(n.关联雅集&&x.雅集?.[n.关联雅集]?button('打开请柬','club',{id:n.关联雅集}):button('前去问询','ask',{text:'我想了解「'+(n.标题||id)+'」，请依据我的地点、时间和可知信息继续，不将传闻直接当成事实，不自动替我接取任务。'}))+'</article>').join('')||empty('此刻尚无新闻讯。'))+'<div class="sa-actions">'+button('听听近日山门小事','ask',{text:'我想听听蜀山近日的小流言、同门趣事与生活动静。请按当前身份、地点和剧情时间更新少量蜀山剑门.闻讯，保留尚有效的消息，注明来源与传闻性质，避免大事件轰炸。'})+'</div></div>';}
  function clubDetails(id,g){
    const {x}=stats(),joined=(x.我的雅集||[]).includes(id),activity=C.obj(g.活动),waiting=list(x,'办理').filter(([,r])=>['待确认','已批准'].includes(r.状态)&&r._凭证?.对象===id),pending=waiting.length>0;
    const html=button('返回雅集','club-back')+'<article class="sa-invitation"><header class="sa-invitation-head"><div class="sa-invitation-emblem"><span class="sa-club-emblem">'+E(g.社印||'社')+'</span><span>同门雅集</span></div><div><div class="sa-eyebrow">'+E(g.主题||'同门相聚')+'</div><h4>'+E(g.名称||id)+'</h4><p class="sa-club-poem">'+E(g.诗句)+'</p></div></header><p class="sa-club-description">'+br(g.简介)+'</p><dl class="sa-club-facts"><div><dt>常聚之处</dt><dd>'+E(g.场所||'待问询')+'</dd></div><div><dt>递帖同门</dt><dd>'+E(Array.isArray(g.联系人)?g.联系人.join('、'):g.联系人||'尚待结识')+'</dd></div><div><dt>定期会日</dt><dd>初五 · 十五 · 廿五</dd></div></dl>'+(activity.标题?'<section class="sa-club-next"><div class="sa-news-meta"><span>近期相聚</span><span>'+E(activity.时间)+'</span></div><h5>'+E(activity.标题)+'</h5><p>'+br(activity.说明)+'</p>'+button(joined?'拟写赴会请求':'问询旁听','ask',{text:'我想'+(joined?'参加':'问询旁听')+'「'+(g.名称||id)+'」的「'+activity.标题+'」，请核对剧情日期、场所和参与要求后再安排。'})+'</section>':empty('近期活动尚待同门相商。','我想向「'+(g.名称||id)+'」的同门问询近期活动，请将确认的活动写入对应雅集。'))+'<div class="sa-invitation-actions">'+(joined?'<div class="sa-membership-mark"><span class="sa-small-seal">友</span><span>名帖已录 · 同袍相候</span></div>':'')+button(pending?'待剧情确认':joined?'退出雅集':(x.我的雅集||[]).length>=2?'雅集名额已满':'问询入社',joined?'leave':'join',{id},!joined,pending||!joined&&(x.我的雅集||[]).length>=2)+waiting.map(([rid])=>button('撤回申请','cancel',{id:rid})).join('')+'<span class="sa-quiet-note">已加入 '+(x.我的雅集||[]).length+' / 2 个雅集</span></div></article>';
    return ui.stamp?.kind==='club'&&ui.stamp.id===id&&ui.stamp.until>Date.now()?html.replace('class="sa-small-seal"','class="sa-small-seal sa-new-stamp"'):html;
  }
  function clubs(){
    const {x}=stats(),top=heading('同门雅集 · 与子同游','闲来结同袍','一盏茶，一柄剑，山中自有相逢处。','<div class="sa-living-date"><span>'+(x.我的雅集||[]).length+' / 2</span><small>我的雅集</small></div>');
    if(ui.creating)return '<div class="sa-content">'+top+button('返回雅集','club-back')+'<div class="sa-create-form"><div class="sa-form-grid"><label class="sa-field">雅集名称<input data-group-field="名称" maxlength="30" required value="'+E(ui.form.名称)+'"><small>以社、会或同好结尾</small></label><label class="sa-field">相聚之处<input data-group-field="场所" maxlength="100" required value="'+E(ui.form.场所)+'"></label><label class="sa-field sa-field-wide">想与同门一起做些什么<textarea data-group-field="简介" maxlength="500" required>'+E(ui.form.简介)+'</textarea></label></div><p class="sa-quiet-note">向教务堂报备，无需功德；获准后占用一个雅集名额。</p>'+button('拟写报备请求','create-group',{},true)+'</div></div>';
    if(ui.club&&x.雅集?.[ui.club])return '<div class="sa-content">'+top+clubDetails(ui.club,x.雅集[ui.club])+'</div>';
    const visible=list(x,'雅集').filter(([id])=>ui.clubs!=='我的雅集'||(x.我的雅集||[]).includes(id));
    return '<div class="sa-content">'+top+'<div class="sa-club-tools"><div class="sa-task-filters">'+['我的雅集','结识雅集'].map(t=>'<button type="button" class="sa-filter cursor-interaction" data-action="clubs-filter" data-id="'+t+'" aria-pressed="'+(ui.clubs===t)+'">'+t+'</button>').join('')+'</div>'+button('发起雅集','create-form',{},false,(x.我的雅集||[]).length>=2)+'</div><div class="sa-club-grid">'+visible.map(([id,g])=>'<article class="sa-club-card"><div class="sa-club-card-head"><span class="sa-club-emblem">'+E(g.社印||'社')+'</span><div><h4>'+E(g.名称||id)+'</h4><div class="sa-club-card-type">'+E(g.主题)+'</div></div></div><p>'+E(g.诗句||g.简介)+'</p><div class="sa-club-card-foot"><span>'+E((x.我的雅集||[]).includes(id)?'已入雅集':g.场所||'待问询')+'</span>'+button('打开请柬','club',{id})+'</div></article>').join('')+'</div>'+(visible.length?'':empty('尚待同袍相识，可先结识雅集。'))+'</div>';
  }
  function calendar(){return renderShushanCalendar({C,G,A,s:stats().s,ui,E,br,button,heading,empty});}
  function departments(){
    const {x}=stats(),work=C.obj(x.任职),pending=list(x,'政务申请').filter(([,a])=>['待确认','已批准'].includes(a.状态)),jobs=list(x,'剑札').filter(([,q])=>q.部门===work.部门&&['待接取','进行中','待结算'].includes(q.状态));
    const jobView=work.状态==='在任'?'<section class="sa-department-jobs"><div class="sa-eyebrow">'+E(work.部门)+' · 待办职事</div>'+jobs.map(([id,q])=>'<article class="sa-department-job"><div><h5>'+E(q.名称||id)+'</h5><p>'+br(q.目标)+'</p><span class="sa-quiet-note">'+E(q.状态)+'</span></div>'+button(q.状态==='待接取'?'接取职事':'回报进展',q.状态==='待接取'?'accept':'progress',{id},q.状态==='待接取')+'</article>').join('')+button('请主事安排职事','ask',{text:'我想请'+work.部门+'主事安排适合我当前职责的工作。'})+'</section>':'';
    return '<div class="sa-content">'+heading('百司职事 · 各有所长','以剑担山门','修行不独问剑，亦在万事躬行。','<span class="sa-page-number">司</span>')+'<section class="sa-office-current"><div class="sa-eyebrow">当前任职</div><h4>'+E(work.状态==='在任'?work.部门+' · '+work.职务:'尚未任职')+'</h4><p>'+E(work.状态==='在任'?'部门职事归入师门剑札，领取后按剧情完成。':'内门起可申请，先由主事核对职责与修为。')+'</p>'+(work.状态==='在任'?button('申请离任','growth',{type:'离任',id:work.部门}):'')+'</section>'+jobView+'<div class="sa-office-grid">'+G.DEPTS.map(d=>{const isHere=work.部门===d.名称&&work.状态==='在任',wait=pending.some(([,a])=>a._凭据?.对象===d.名称);return '<article class="sa-office"><div class="sa-news-meta"><span>门中职司</span><span>'+E(isHere?'在任':wait?'待主事核准':'可申请')+'</span></div><h4>'+E(d.名称)+'</h4><p>'+E(d.职责)+'</p>'+button(isHere?'已在任':wait?'申请待核':'递帖入司','growth',{type:'入司',id:d.名称},false,isHere||wait)+'</article>';}).join('')+'</div>'+(pending.length?'<div class="sa-background-note">待核申请：'+pending.map(([,a])=>E((a._凭据?.对象||'部门')+' · '+a.状态)).join('、')+'</div>':'')+'</div>';
  }
  function governance(){
    const {s,x}=stats(),owned=list(x,'峰脉名录').filter(([id,p])=>id===x.名籍?.自立峰||p.峰主===s.主角.姓名),can=G.realm(s)>=5&&!owned.some(([,p])=>p.状态==='已立峰');
    return '<div class="sa-content">'+heading('掌峰议事 · 开山立脉','为后来人点灯','辟一峰烟霞，续千载剑火。','<span class="sa-page-number">峰</span>')+owned.map(([id,p])=>'<section class="sa-office-current"><div class="sa-news-meta"><span>'+E(p.状态)+'</span><span>'+E(p.成立时间)+'</span></div><h4>'+E(p.名称)+'</h4><p>'+E(p.传承方向)+' · '+E(p.选址)+'</p><dl class="sa-facts"><div><dt>门下弟子</dt><dd>'+list(p,'弟子').length+' 人</dd></div><div><dt>峰中设施</dt><dd>'+list(p,'设施').length+' 处</dd></div><div><dt>招生事务</dt><dd>'+E(p.招生?.状态||'尚未启动')+'</dd></div></dl><div class="sa-actions">'+button('筹备招生','ask',{text:'我想为自立峰「'+p.名称+'」（名录编号 '+id+'）筹备招生。请按灵脉容量、资源、教习与宗门许可制定计划，经实际遴选再录入弟子，不凭空增加门人。'})+button('核对峰中事务','ask',{text:'请核对自立峰「'+p.名称+'」的门人、设施与当前事务，按实际剧情更新峰脉名录，不自动获得资源或收入。'})+'</div></section>').join('')+(can?'<div class="sa-create-form"><div class="sa-eyebrow">申请开山立峰</div><div class="sa-form-grid"><label class="sa-field">拟议峰名<input data-peak-field="名称" maxlength="21" required value="'+E(ui.peakForm.名称)+'"><small>独立新峰，以“峰”结尾</small></label><label class="sa-field">传承方向<input data-peak-field="方向" maxlength="100" required value="'+E(ui.peakForm.方向)+'"></label><label class="sa-field sa-field-wide">拟议选址<input data-peak-field="选址" maxlength="150" required value="'+E(ui.peakForm.选址)+'"></label></div><p class="sa-quiet-note">炼虚起可申请。宗主许可、灵脉、资源、阵法与立峰仪式须逐一落实。</p>'+button('拟立峰剑札','growth',{type:'开峰'},true)+'</div>':!owned.length?empty('炼虚起方可申请开峰；当前可先处理宗门事务。'):'')+'<div class="sa-actions">'+button('议宗门事务','ask',{text:'请根据我当前蜀山职务、境界与权限，提供可处理的真实宗门事务，录入师门剑札；不自动接任宗主、不代替其他人授予职权。'})+'</div></div>';
  }
  function render(){
    if(!current?.data||!C.member(current.data.stat_data)){remove();return;}
    const {s,x,p}=stats(),target=doc.querySelector('.mes[mesid="'+current.last.message_id+'"] .mes_text');if(!target)return;
    if(!mount||!mount.isConnected){mount=doc.createElement('div');mount.setAttribute('data-shushan-frontend','');mount.style.cssText='display:block;margin:16px 0 0';target.append(mount);shadow=mount.attachShadow({mode:'open'});shadow.addEventListener('click',click);shadow.addEventListener('input',e=>{if(e.target.dataset.groupField)ui.form[e.target.dataset.groupField]=e.target.value;if(e.target.dataset.peakField)ui.peakForm[e.target.dataset.peakField]=e.target.value;if(e.target.dataset.calendarField)(ui.calendarForm??={})[e.target.dataset.calendarField]=e.target.value;if(e.target.dataset.updateField){(ui.settingsDraft??={...settings})[e.target.dataset.updateField]=e.target.type==='checkbox'?e.target.checked:e.target.value;if(e.target.dataset.updateField==='mode')render();}});signature='';}
    if(mount.parentElement!==target)target.append(mount);
    for(const old of doc.querySelectorAll('[data-shushan-frontend]'))if(old!==mount)old.remove();
    const activePages=visiblePages();if(!activePages.some(([id])=>id===ui.page)||!pageAllowed(ui.page))ui.page='identity';
    const body=({identity,tasks:taskView,practice,merit,news,clubs,calendar,departments,governance})[ui.page]();
    const tracked=x.剑札?.[x.追踪剑札];
    const html='<style>'+CSS+'</style><div id="shushan-community-preview"><article class="sa-shell"><div class="sa-topline"></div><header class="sa-head"><div class="sa-seal" aria-hidden="true">蜀</div><div class="sa-brand"><h2>蜀山剑门</h2><div class="sa-subtitle">'+E(p.姓名||p.道号||'蜀山弟子')+' · '+E(G.profile(s).归属)+' · '+E(C.role(s,x))+'</div></div><div class="sa-credit" aria-label="宗门贡献"><span>功德</span><strong>'+num(p.宗门贡献)+'</strong></div><button type="button" class="sa-settings-toggle cursor-interaction" data-action="settings" aria-label="更新设置" aria-expanded="'+!!ui.settingsOpen+'">设置</button><button type="button" class="sa-reset-toggle cursor-interaction" data-action="reset-floor" aria-label="恢复本楼初态" title="撤回本楼面板操作，恢复本楼更新后的状态" '+(isBusy()||updating?'disabled':'')+'><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 7v5h-5"></path><path d="M19.1 8A8 8 0 1 0 20 16"></path></svg></button><button type="button" class="sa-collapse cursor-interaction" data-action="collapse" aria-expanded="'+ui.open+'">'+(ui.open?'⌃ 收令':'⌄ 展令')+'</button></header>'+(ui.settingsOpen?settingsView():'')+'<div '+(ui.open?'':'hidden')+'><nav class="sa-nav" style="--sa-tab-count:'+activePages.length+'" role="tablist" aria-label="弟子令功能">'+activePages.map(([id,label])=>'<button type="button" role="tab" class="sa-tab cursor-interaction" data-action="page" data-id="'+id+'" aria-label="'+label+'" '+(!pageAllowed(id)?'disabled aria-disabled="true" aria-description="'+(id==='departments'?'内门及以上解锁':'炼虚或长老及以上解锁')+'"':'')+' id="ss-tab-'+id+'" aria-controls="ss-current-page" aria-selected="'+(id===ui.page)+'">'+label+(!pageAllowed(id)?'<small class="sa-lock" aria-hidden="true">锁</small>':'')+'</button>').join('')+'</nav><div class="sa-page sa-page-in" id="ss-current-page" role="tabpanel" aria-labelledby="ss-tab-'+ui.page+'">'+body+'</div><div class="sa-following"><span class="sa-following-label">当前剑札</span><span class="sa-following-name">'+E(tracked?.名称||'尚未追踪事务')+'</span>'+button('查看在办','page',{id:'tasks'})+'</div>'+(ui.notice?'<div class="sa-feedback" role="status" aria-live="polite">'+E(ui.notice)+'</div>':'')+'<footer class="sa-foot"><span>蜀山有路　此心长明</span><span>云深不改青锋意</span></footer></div></article></div>';
    const next=hash(html);if(next===signature)return;shadow.innerHTML=html;signature=next;if(ui.stamp?.kind==='task'&&ui.stamp.until>Date.now()){const card=[...shadow.querySelectorAll('[data-quest]')].find(el=>el.dataset.quest===ui.stamp.id);card?.querySelector('.sa-stamp')?.classList.add('sa-new-stamp');}
  }
  function naturalAsk(el){
    const label=el.textContent.trim(),titles=[...(el.dataset.text||'').matchAll(/「([^」]+)」/g)].map(m=>m[1]),name=titles[0]||'此事';
    const lines={'核对名籍与居所':'我到内务堂核对自己的名籍，问清师承、住处和入门时日。','递帖求见师尊':'我向师尊白薇递上拜帖，问候她是否方便赐见。','问询师门事务':'我去任务堂看看，问问近日有没有适合我的委托。','问询近期课程':'我去教务堂问问，近日有哪些适合我的课程，何时可以前去听讲。','问询藏经阁':'我去藏经阁请教值守执事，有哪些典籍适合我如今借阅或进修，借阅规矩与所需功德又是如何。','问询兑换物资':'我去功德堂看看，问问现在可以兑换哪些丹药、法器和灵材，各需多少功德。','听听近日山门小事':'得闲走一走，我想听听同门近来的趣事、闲谈和山中见闻。','议宗门事务':'我想了解眼下有哪些宗门事务需要我出面，先听听值事的安排。'};
    if(lines[label])return lines[label];
    if(label==='请主事安排职事')return '我想向眼下任职的部门主事问问，近日有什么适合我承担的工作。';
    if(label==='问询报价')return '我想问问「'+name+'」的价目和申领规矩。';
    if(label==='问询赴课')return '我想去听「'+name+'」，先问清时辰、地点和需要准备的事。';
    if(label==='商议放弃')return '我想与任务堂商议，若不能继续「'+name+'」，该如何交代与收尾。';
    if(label==='筹备招生')return '我想为「'+name+'」筹备招生，先与值事商议门人名额、教习和安置事宜。';
    if(label==='核对峰中事务')return '我想了解「'+name+'」近日的门人、设施与待办事务。';
    if(label==='拟写赴会请求'||label==='问询旁听')return '我想去「'+name+'」'+(titles[1]?'参加「'+titles[1]+'」':'与同门相聚')+'，先问清会期与地点。';
    return titles.length?'我想了解「'+name+'」，先向知情的同门问个清楚。':'我想向值事问问'+label+'的安排。';
  }
  function requestSentence(rid,r){const p=r._凭证,name='「'+p.名称+'」';if(p.类型==='借阅')return '我想向藏经阁借阅'+name+p.天数+'日，请值守执事核验并登记。';if(p.类型==='兑换')return '我想用宗门功德兑换'+name+' '+p.数量+'份，先请执事核对价目与现货。';if(p.类型==='传承')return '我想请教'+name+'的传授事宜，依规递交申请。';if(p.类型==='归还')return '我来归还借阅的'+name+'，请执事查验。';if(p.类型==='入社')return '我想加入'+name+'，先向同门递上名帖，问问入社的规矩。';if(p.类型==='退社')return '我想暂别'+name+'，向同门说明缘由，妥善交代手头的事。';return '我想向教务堂报备成立'+name+'，与同门商议场所和活动。';}
  async function lodge(type,id,options={}){
    let r,rid=localId('办');await write(data=>{r=C.request(data.stat_data,type,id,{...options,rid});data.stat_data.蜀山剑门.办理[rid]=r;return data;});
    if(!r)return;fill(requestSentence(rid,r),{类型:'办理',编号:rid});await refresh();
  }
  function click(event){
    const el=event.target.closest('button[data-action]');if(!el||el.disabled)return;
    const action=el.dataset.action,id=el.dataset.id;
    if(action==='reset-floor'){enqueue(resetFloor).catch(()=>{});return;}
    if(action==='settings'){ui.settingsOpen=!ui.settingsOpen;ui.settingsDraft={...settings};render();return;}
    if(action==='settings-close'){ui.settingsOpen=false;ui.settingsDraft=null;render();return;}
    if(action==='settings-cancel'){cancelUpdate();notify('本次蜀山独立更新已取消。');return;}
    if(action==='settings-save'){try{const next=U.validate(ui.settingsDraft||settings);let stored=true;try{host.localStorage.setItem(settingsKey,JSON.stringify(next));}catch{stored=false;}cancelUpdate();settings=next;lastUpdateFingerprint=updateToken(read());health.update={mode:settings.mode,state:'已保存'};ui.notice=stored?'设置已保存，将用于后续回复。':'设置已用于本次会话；当前浏览环境未提供本机存储。';ui.settingsDraft={...settings};render();injectState(current);}catch(error){notify(error.message);}return;}
    if(action==='settings-update'){queueUpdate(true);return;}
    if(action==='promotion'){ui.promotionOpen=!ui.promotionOpen;render();injectState(current);return;}
    if(action==='promotion-task'){ui.page='tasks';ui.tasks='进行中';render();return;}
    if(action==='page'){if(!visiblePages().some(([key])=>key===id)||!pageAllowed(id))return;ui.page=id;ui.notice='';render();injectState(current);return;}
    if(action==='collapse'){ui.open=!ui.open;render();return;}
    if(action==='task-filter'){ui.tasks=id;render();return;}
    if(action==='service'){ui.service=id;ui.category='全部';render();return;}
    if(action==='category'){ui.category=id;render();return;}
    if(action==='clubs-filter'){ui.clubs=id;ui.club=null;ui.creating=false;render();return;}
    if(action==='club'){ui.page='clubs';ui.club=id;ui.creating=false;render();return;}
    if(action==='club-back'){ui.club=null;ui.creating=false;render();return;}
    if(action==='create-form'){ui.creating=true;render();return;}
    if(action==='cal-month'){const m=A.monthInfo(stats().s,ui.calendarMonth);ui.calendarMonth=id==='today'?null:A.monthKey(G.addMonths(m.start,Number(id)));ui.calendarDay=null;render();return;}
    if(action==='cal-day'){ui.calendarDay=id;ui.calendarMode='当日';render();return;}
    if(action==='cal-mode'){ui.calendarMode=id;render();return;}
    if(action==='cal-form'){ui.calendarAdding=id!=='close';ui.calendarForm??={};render();return;}
    if(['ask','progress','resume'].includes(action)){
      try{
        if(action==='ask')fill(naturalAsk(el),{类型:'问询',说明:el.dataset.text,...(el.dataset.event?{活动编号:el.dataset.event,开始:el.dataset.start,结束:el.dataset.end}:{})});
        else if(action==='progress'){const t=stats().x.剑札?.[id];fill('我想向值事回报「'+(t?.名称||id)+'」的进展，核对尚欠哪些安排；若已办妥，也请依规办理交接。',{类型:'核对剑札进度',编号:id,要求:'按实际经历补全相应批准和确认字段，确实完成才设待结算，由脚本统一办理，勿重复改同笔贡献或身份。'});}
        else{const r=stats().x.办理?.[id];if(r)fill(requestSentence(id,r),{类型:'办理',编号:id});}
      }catch(error){notify(error.message);}
      return;
    }
    enqueue(async()=>{panelAction=true;try{
      if(action==='promote'){let name='',qid='';await write(data=>{const next=G.request(data,'晋升',id);qid=next.stat_data.蜀山剑门.追踪剑札;name=next.stat_data.蜀山剑门.剑札[qid].名称;return next;});fill(id.startsWith('宗主')?(id==='宗主常规继任'?'我已备妥承继名帖，想与师尊及门中长辈商议授印交接的安排。':'我依门中议定的承继安排递上名帖，想与诸位长老商议授印与职务交接。'):'我想申请「'+name+'」，向主事递上名帖，领一份具体的差事，问清应当如何办妥、向谁交代。',{类型:'晋升任务',编号:qid,要求:'按当前修为与地点细化实际任务；完成后依晋升规则补确认与批准字段，不重复改同笔身份。'});}
      else if(action==='cal-mark'){const item=ui.agendaRows?.[id];await write(data=>A.mark(data,item,el.dataset.state));}
      else if(action==='cal-add'){for(const input of shadow.querySelectorAll('[data-calendar-field]'))if(!input.reportValidity())return;await write(data=>A.add(data,localId('记事'),ui.calendarForm||{}));ui.calendarAdding=false;ui.calendarForm={};ui.notice='这桩事已记入日历。';}
      else if(action==='growth'){
        const type=el.dataset.type;
        if(type==='开峰')for(const input of shadow.querySelectorAll('[data-peak-field]'))if(!input.reportValidity())return;
        await write(data=>G.request(data,type,id,ui.peakForm));
        const path=type==='活动报名'?'活动记录/'+id:type==='开峰'?'剑札/开峰-'+ui.peakForm.名称:'政务申请/'+type+'-'+id;
        const activity=type==='活动报名'?G.calendars(stats().s).find(e=>e.id===id):null;
        const line=type==='活动报名'?(activity?.名称==='宗门招收季'?'我想向值事问问，这一届迎新是否需要人手，愿领一份力所能及的差事。':'我想报名参加这一届「'+(activity?.名称||'宗门活动')+'」，向主事递交名帖，问清参会安排。'):type==='入司'?'我想向'+id+'递帖任职，先拜访主事，问问有什么适合我的职务。':type==='离任'?'我想向'+id+'主事申请离任，先商议如何交接手头的事务。':'我想筹立「'+ui.peakForm.名称+'」，以'+ui.peakForm.方向+'为传承方向，选址'+ui.peakForm.选址+'。先向宗门递上方案，请示筹备之事。';
        fill(line,{类型:type,路径:'/蜀山剑门/'+path});
      }else if(action==='accept'){
        let name='';await write(data=>{const x=C.extension(data.stat_data),t=x.剑札?.[id];if(!t||t.状态!=='待接取')throw new Error('这份剑札的状态已变化。');t.状态='进行中';t._接取时间=C.str(data.stat_data.世界?.当前时间)||'本轮确认接取';x.追踪剑札=id;name=t.名称||id;return data;});ui.stamp={kind:'task',id,until:Date.now()+1200};ui.tasks='进行中';fill('我接下「'+name+'」这份差事，先向值事问清细节与动身前的准备。',{类型:'接取剑札',编号:id});
      }else if(action==='track'){await write(data=>{data.stat_data.蜀山剑门.追踪剑札=id;return data;});}
      else if(action==='offer'){
        const offer=stats().x.目录?.[id];const input=[...shadow.querySelectorAll('[data-offer-quantity]')].find(i=>i.dataset.offerQuantity===id);await lodge(offer?.方式,id,{qty:Number(input?.value||1),days:Number(input?.value||1)});
      }else if(action==='return')await lodge('归还',id);
      else if(action==='join'||action==='leave')await lodge(action==='join'?'入社':'退社',id);
      else if(action==='create-group'){
        for(const input of shadow.querySelectorAll('[data-group-field]'))if(!input.reportValidity())return;
        const gid=localId('雅');await lodge('建社',gid,{group:ui.form});
      }else if(action==='cancel'){
        const info=read(),saved=checkpoint(info),drafts=(saved?.drafts||[]).filter(d=>d.receipt===id);
        const receipt=info?.data?.stat_data?.蜀山剑门?.办理?.[id];
        await write(data=>{const r=data.stat_data.蜀山剑门.办理?.[id];if(!r||!['待确认','已批准'].includes(r.状态)||r._已结算)throw new Error('该申请已经办妥或状态已变化，不能直接撤回。');r.状态='已撤销';return data;});
        if(!drafts.length&&receipt){const input=doc.querySelector('#send_textarea'),text=requestSentence(id,receipt);if(input&&input.value.split('\n').includes(text)){input.value=input.value.split('\n').filter(line=>line!==text).join('\n');input.dispatchEvent(new host.Event('input',{bubbles:true}));}}
        cleanDraft(drafts);if(ui.intent?.details?.编号===id)ui.intent=null;ui.notice='申请已撤回，尚未办理的归属与功德不作变更。';
      }
      await refresh();
    }finally{panelAction=false;}}).catch(()=>{});
  }
  for(let i=0;i<100&&!stopped;i++){if(['getChatMessages','injectPrompts','eventOn'].every(n=>api(n)))break;await new Promise(r=>setTimeout(r,250));}
  if(!['getChatMessages','injectPrompts','eventOn'].every(n=>api(n)))throw new Error('酒馆助手接口尚未就绪，请检查脚本日志。');
  // 独立助手脚本需先接入共享接口；此前 window.Mvu 不存在是正常状态。
  if(api('waitGlobalInitialized')){
    health.phase='waiting-mvu';health.detail='正在接入原卡共享的 MVU 接口';
    const value=await api('waitGlobalInitialized')('Mvu');
    if(value?.getMvuData&&value?.replaceMvuData)sharedMvu=value;
  }
  for(let i=0;i<100&&!stopped;i++){if(M()?.getMvuData&&M()?.replaceMvuData)break;await new Promise(r=>setTimeout(r,250));}
  if(!M()?.getMvuData||!M()?.replaceMvuData)throw new Error('原 MVU 接口接入失败，请检查原卡 MVU 脚本是否开启。');
  const on=api('eventOn'),events=window.tavern_events||host.tavern_events||{},hold=h=>{if(h?.stop)stops.push(()=>h.stop());else if(typeof h==='function')stops.push(h);};
  const nativeRoots=new WeakMap();
  for(const name of ['MESSAGE_SWIPED','MESSAGE_SENT','MESSAGE_RECEIVED','MESSAGE_EDITED','MESSAGE_DELETED','MESSAGE_UPDATED','MESSAGE_SWIPE_DELETED','MORE_MESSAGES_LOADED','CHARACTER_MESSAGE_RENDERED','USER_MESSAGE_RENDERED'])if(events[name])hold(on(events[name],()=>schedule()));
  if(events.CHAT_CHANGED)hold(on(events.CHAT_CHANGED,()=>{cancelUpdate();busy=false;mvuBusy=false;mvuWithReply=false;remove();stopInjection();current=null;key='';schedule(30);}));
  for(const name of ['MESSAGE_RECEIVED','MESSAGE_EDITED','MESSAGE_UPDATED'])if(events[name])hold(on(events[name],()=>{queueUpdate();}));
  if(events.MESSAGE_SWIPED)hold(on(events.MESSAGE_SWIPED,()=>{cancelUpdate();lastUpdateFingerprint=updateToken(read());}));
  if(events.GENERATION_STARTED)hold(on(events.GENERATION_STARTED,(_type,options,dryRun)=>{if(dryRun||options?.dryRun)return;busy=true;}));
  if(events.GENERATION_AFTER_COMMANDS)hold(on(events.GENERATION_AFTER_COMMANDS,async()=>{await queue;await refresh(true);}));
  for(const name of ['GENERATION_ENDED','GENERATION_STOPPED'])if(events[name])hold(on(events[name],()=>{busy=false;if(!M()?.isDuringExtraAnalysis?.()){mvuBusy=false;mvuWithReply=false;}schedule(180);}));
  if(M().events?.VARIABLE_UPDATE_STARTED)hold(on(M().events.VARIABLE_UPDATE_STARTED,()=>{mvuBusy=true;mvuWithReply=busy||liveGeneration()===true;}));
  if(M().events?.COMMAND_PARSED){const filter=(data,commands,text)=>{if(data&&typeof data==='object'&&!nativeRoots.has(data)){const fresh=read(),present=(fresh?.last.message===text?fresh.data?.stat_data?.蜀山剑门:null)||data.stat_data?.蜀山剑门;nativeRoots.set(data,present?C.clone(present):null);}U.filter(commands);};hold(on(M().events.COMMAND_PARSED,filter));hold(on(M().events.COMMAND_PARSED+'_ended_for_zod',filter));}
  if(M().events?.VARIABLE_UPDATE_ENDED)hold(on(M().events.VARIABLE_UPDATE_ENDED,(data,previous)=>{if(!data?.stat_data||!previous?.stat_data)return;const present=nativeRoots.has(data)?nativeRoots.get(data):previous.stat_data.蜀山剑门;if(present)data.stat_data.蜀山剑门=C.clone(present);else delete data.stat_data.蜀山剑门;if(data.display_data&&present)data.display_data.蜀山剑门=C.clone(present);if(data.delta_data)delete data.delta_data.蜀山剑门;queueUpdate();}));
  if(M().events?.BEFORE_MESSAGE_UPDATE)hold(on(M().events.BEFORE_MESSAGE_UPDATE,()=>queueUpdate()));
  const mvuDone=new Set([M().events?.VARIABLE_UPDATE_ENDED,M().events?.BEFORE_MESSAGE_UPDATE]);
  if(M().events?.VARIABLE_UPDATE_ENDED)mvuDone.add(M().events.VARIABLE_UPDATE_ENDED+'_for_zod');
  for(const name of mvuDone)if(name)hold(on(name,()=>{mvuBusy=false;mvuWithReply=false;const info=read();if(checkpoint(info))saveCheckpoint(info,null);schedule(180);}));
  hold(on('daoyuan_mvu_manual_updated',()=>{if(!writing)schedule();}));
  const observer=new host.MutationObserver(()=>{if(writing)return;if(mount&&!mount.isConnected||!mount&&health.member)schedule(180);});observer.observe(doc.body||doc.documentElement,{childList:true,subtree:true});
  const stateSignature=info=>JSON.stringify([info?.data?.stat_data?.主角,info?.data?.stat_data?.蜀山剑门,info?.data?.stat_data?.世界?.当前时间]);
  const reconnect=setInterval(()=>{if(stopped||writing)return;const wasBusy=busy||mvuBusy;activity();if(!busy){const fresh=read();if(wasBusy&&!mvuBusy||fresh?.fingerprint!==current?.fingerprint||stateSignature(fresh)!==stateSignature(current)||mount&&!mount.isConnected||health.phase==='starting')schedule(0);}},1800);
  function dispose(){cancelUpdate();stopped=true;clearTimeout(timer);clearInterval(reconnect);observer.disconnect();for(const stop of stops)try{stop();}catch{}remove();stopInjection();if(host[KEY]===dispose)delete host[KEY];if(host.__shushan===debug)delete host.__shushan;}
  const debug={health:()=>({...health,activity:{...activity()}}),snapshot:()=>current?.data?C.clone(current.data):null,refresh:()=>enqueue(()=>refresh(true)),dispose};host[KEY]=dispose;host.__shushan=debug;
  window.addEventListener('pagehide',dispose,{once:true});await refresh(true);
}

await runShushan("\r\n\r\n#shushan-community-preview{--sa-font:14px;--sa-glow:.5;--sa-paper:#101d25;--sa-deep:#0a151c;--sa-raised:#172a33;--sa-ink:#e3ede8;--sa-soft:#a6c0c4;--sa-faint:#87a5ad;--sa-line:#344c53;--sa-gold:#d5bc80;--sa-jade:#8ed0cf;--sa-red:#d5a58a;--sa-sky:#0d2530;--sa-mist:#41616b;--sa-rock:#1c4553;--sa-rock-lit:#346170;--sa-rock-shade:#183541;--sa-snow:#8aafa9;--sa-water:#89b8bd;--sa-sans:\"Microsoft YaHei\",\"PingFang SC\",sans-serif;--sa-serif:\"Noto Serif SC\",\"Source Han Serif SC\",\"STSong\",\"SimSun\",serif}\r\n#shushan-community-preview [hidden]{display:none!important}\r\n#shushan-community-preview [data-sa-stage]{padding:15px 0 5px}\r\n#shushan-community-preview .sa-shell{position:relative;isolation:isolate;overflow:hidden;width:100%;box-sizing:border-box;background:var(--sa-paper);color:var(--sa-ink);font:400 var(--sa-font)/1.75 var(--sa-sans);border:1px solid var(--sa-line);border-radius:3px 20px 3px 20px;box-shadow:0 18px 45px color-mix(in srgb,var(--sa-ink) 10%,transparent)}\r\n#shushan-community-preview .sa-shell *{box-sizing:border-box}\r\n#shushan-community-preview .sa-shell button,#shushan-community-preview .sa-shell textarea{font:inherit;color:inherit}\r\n#shushan-community-preview .sa-shell button{touch-action:manipulation}\r\n#shushan-community-preview .sa-shell button:disabled{cursor:not-allowed;opacity:.55}\r\n#shushan-community-preview .sa-shell p,#shushan-community-preview .sa-shell h2,#shushan-community-preview .sa-shell h3,#shushan-community-preview .sa-shell h4{margin:0;font-weight:400}\r\n#shushan-community-preview .sa-topline{height:3px;background:linear-gradient(90deg,transparent,var(--sa-gold) 30%,var(--sa-jade) 70%,transparent)}\r\n#shushan-community-preview .sa-head{display:flex;align-items:center;gap:15px;position:relative;padding:20px 27px;background:linear-gradient(120deg,color-mix(in srgb,var(--sa-jade) 9%,var(--sa-paper)),var(--sa-paper) 65%);border-bottom:1px solid var(--sa-line)}\r\n#shushan-community-preview .sa-seal{flex:none;position:relative;display:grid;place-items:center;width:47px;height:55px;font:26px var(--sa-serif);color:var(--sa-gold);border:1px solid var(--sa-gold);border-radius:3px 3px 17px 17px;box-shadow:inset 0 0 17px color-mix(in srgb,var(--sa-gold) 10%,transparent);background:var(--sa-raised)}\r\n#shushan-community-preview .sa-seal:before{content:\"\";position:absolute;inset:4px;border:1px solid color-mix(in srgb,var(--sa-gold) 45%,transparent);border-radius:1px 1px 13px 13px}\r\n#shushan-community-preview .sa-brand{min-width:0;flex:1}\r\n#shushan-community-preview .sa-brand h2{font:25px/1.3 var(--sa-serif);letter-spacing:5px}\r\n#shushan-community-preview .sa-subtitle{font-size:11px;color:var(--sa-soft);letter-spacing:2px;margin-top:5px}\r\n#shushan-community-preview .sa-credit{display:flex;align-items:center;gap:10px;color:var(--sa-gold);padding-right:16px;border-right:1px solid var(--sa-line)}\r\n#shushan-community-preview .sa-credit span{font-size:11px;writing-mode:vertical-rl;letter-spacing:3px}\r\n#shushan-community-preview .sa-credit strong{font:400 29px/1 var(--sa-serif);font-variant-numeric:tabular-nums}\r\n#shushan-community-preview .sa-collapse{border:0;background:transparent;display:flex;align-items:center;gap:5px;color:var(--sa-soft)!important;font-size:12px!important;padding:9px 0 9px 4px}\r\n#shushan-community-preview .sa-collapse svg{width:15px;height:15px}\r\n#shushan-community-preview .sa-collapsed{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 26px;color:var(--sa-soft);font-size:12px;background:var(--sa-deep)}\r\n#shushan-community-preview .sa-nav{display:flex;position:relative;gap:0;background:var(--sa-raised);border-bottom:1px solid var(--sa-line);padding:0 19px}\r\n#shushan-community-preview .sa-tab{position:relative;flex:1;display:flex;align-items:center;justify-content:center;gap:7px;padding:15px 5px;background:transparent;border:0;white-space:nowrap;color:var(--sa-soft)!important;font-size:12px!important;letter-spacing:1px;transition:color .2s,background .2s}\r\n#shushan-community-preview .sa-tab svg{width:14px;height:14px}\r\n#shushan-community-preview .sa-tab:after{content:\"\";position:absolute;height:2px;left:25%;right:25%;bottom:0;background:var(--sa-jade);transform:scaleX(0);transition:transform .3s}\r\n#shushan-community-preview .sa-tab:hover{background:color-mix(in srgb,var(--sa-jade) 6%,transparent)}\r\n#shushan-community-preview .sa-tab[aria-selected=true]{color:var(--sa-ink)!important;background:linear-gradient(0deg,color-mix(in srgb,var(--sa-jade) 10%,transparent),transparent)}\r\n#shushan-community-preview .sa-tab[aria-selected=true]:after{transform:scaleX(1);box-shadow:0 -2px calc(13px * var(--sa-glow)) var(--sa-jade)}\r\n#shushan-community-preview .sa-page{position:relative;min-width:0}\r\n#shushan-community-preview .sa-atlas{position:relative;height:425px;overflow:hidden;isolation:isolate;background:var(--sa-sky)}\r\n#shushan-community-preview .sa-art{position:absolute;inset:0;width:100%;height:100%;color:var(--sa-rock);transform:translate(var(--sa-pan-x,0px),var(--sa-pan-y,0px)) scale(1.025);transition:transform .65s ease-out;z-index:-2}\r\n#shushan-community-preview .sa-atlas-wash{position:absolute;inset:0;pointer-events:none;background:linear-gradient(180deg,color-mix(in srgb,var(--sa-paper) 17%,transparent),transparent 35%,color-mix(in srgb,var(--sa-paper) 35%,transparent));z-index:-1}\r\n#shushan-community-preview .sa-map-caption{position:absolute;left:28px;top:25px;max-width:56%;pointer-events:none}\r\n#shushan-community-preview .sa-eyebrow{display:flex;align-items:center;gap:10px;font-size:11px;letter-spacing:3px;color:var(--sa-gold)}\r\n#shushan-community-preview .sa-eyebrow:before{content:\"\";height:1px;width:22px;background:currentColor}\r\n#shushan-community-preview .sa-map-caption h3{font:31px/1.5 var(--sa-serif);letter-spacing:5px;margin:9px 0 5px}\r\n#shushan-community-preview .sa-map-caption p{color:var(--sa-soft);font:12px/1.8 var(--sa-serif);letter-spacing:1px}\r\n#shushan-community-preview .sa-map-north{position:absolute;right:24px;top:23px;color:var(--sa-gold);font:12px var(--sa-serif);writing-mode:vertical-rl;letter-spacing:4px;border-right:1px solid var(--sa-gold);padding-right:9px}\r\n#shushan-community-preview .sa-map-nodes{position:absolute;inset:0}\r\n#shushan-community-preview .sa-peak-button{position:absolute;left:var(--x);top:var(--y);transform:translate(-50%,-50%);display:flex;flex-direction:column;align-items:center;gap:4px;min-width:74px;padding:7px 9px;border:1px solid color-mix(in srgb,var(--sa-line) 75%,transparent);border-radius:2px;background:color-mix(in srgb,var(--sa-raised) 93%,transparent);color:var(--sa-ink)!important;box-shadow:0 7px 17px color-mix(in srgb,var(--sa-deep) 20%,transparent);transition:transform .25s,border-color .25s,box-shadow .25s;z-index:2}\r\n#shushan-community-preview .sa-peak-button:before{content:\"\";position:absolute;left:50%;bottom:-12px;width:1px;height:12px;background:var(--sa-gold)}\r\n#shushan-community-preview .sa-peak-button:hover,#shushan-community-preview .sa-peak-button:focus-visible{transform:translate(-50%,-50%) translateY(-4px);border-color:var(--sa-gold);box-shadow:0 0 calc(19px * var(--sa-glow)) color-mix(in srgb,var(--sa-jade) 25%,transparent)}\r\n#shushan-community-preview .sa-peak-name{font:16px/1.2 var(--sa-serif);letter-spacing:2px}\r\n#shushan-community-preview .sa-peak-tag{font-size:11px;color:var(--sa-soft);line-height:1.3}\r\n#shushan-community-preview .sa-peak-button[aria-pressed=true]{border-color:var(--sa-gold);background:var(--sa-raised);box-shadow:0 0 calc(22px * var(--sa-glow)) color-mix(in srgb,var(--sa-jade) 26%,transparent)}\r\n#shushan-community-preview .sa-peak-button[aria-pressed=true]:after{content:\"\";position:absolute;width:5px;height:5px;border-radius:50%;bottom:-17px;background:var(--sa-jade);box-shadow:0 0 10px var(--sa-jade)}\r\n#shushan-community-preview .sa-map-bottom{position:absolute;left:26px;right:26px;bottom:18px;display:flex;align-items:center;justify-content:space-between;gap:12px;color:var(--sa-soft);font-size:11px;pointer-events:none}\r\n#shushan-community-preview .sa-map-bottom span:last-child{color:var(--sa-gold);letter-spacing:3px}\r\n#shushan-community-preview .sa-route{fill:none;stroke:var(--sa-jade);stroke-width:1.7;filter:url(#sa-route-glow);stroke-dasharray:1200;stroke-dashoffset:0;transition:d .6s}\r\n#shushan-community-preview .sa-route.sa-fly{animation:sa-route-draw 1s ease-out both}\r\n#shushan-community-preview .sa-map-array{transform-origin:500px 285px;opacity:.23}\r\n#shushan-community-preview .sa-map-cloud{transform:translateX(0);transition:transform 2.6s ease-out}\r\n#shushan-community-preview .sa-atlas:hover .sa-map-cloud{transform:translateX(24px)}\r\n#shushan-community-preview .sa-island{transition:translate .6s,filter .6s;transform-box:fill-box;transform-origin:center}\r\n#shushan-community-preview .sa-island.sa-island-active{translate:0 -5px;filter:drop-shadow(0 0 calc(9px * var(--sa-glow)) color-mix(in srgb,var(--sa-jade) 23%,transparent))}\r\n#shushan-community-preview .sa-island.sa-island-hover{translate:0 -8px;filter:drop-shadow(0 0 calc(14px * var(--sa-glow)) color-mix(in srgb,var(--sa-jade) 32%,transparent))}\r\n#shushan-community-preview .sa-peak-detail{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:20px;padding:24px 28px 26px;background:var(--sa-raised);border-top:1px solid var(--sa-line);position:relative}\r\n#shushan-community-preview .sa-peak-detail:before{content:\"\";position:absolute;top:0;left:28px;height:2px;width:70px;background:var(--sa-gold)}\r\n#shushan-community-preview .sa-detail-title{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:8px}\r\n#shushan-community-preview .sa-detail-title h4{font:24px var(--sa-serif);letter-spacing:3px}\r\n#shushan-community-preview .sa-badge{display:inline-flex;align-items:center;gap:4px;font-size:11px;padding:1px 7px;border:1px solid color-mix(in srgb,var(--sa-gold) 50%,var(--sa-line));color:var(--sa-gold);letter-spacing:1px;white-space:nowrap}\r\n#shushan-community-preview .sa-peak-poem{font:14px/1.9 var(--sa-serif);color:var(--sa-ink);letter-spacing:1px}\r\n#shushan-community-preview .sa-peak-desc{color:var(--sa-soft);font-size:12px;margin-top:8px!important}\r\n#shushan-community-preview .sa-detail-side{min-width:128px;padding-left:21px;border-left:1px solid var(--sa-line);display:flex;flex-direction:column;justify-content:center;align-items:flex-start;gap:8px;font-size:12px;color:var(--sa-soft)}\r\n#shushan-community-preview .sa-detail-side strong{color:var(--sa-ink);font-weight:400}\r\n#shushan-community-preview .sa-button{display:inline-flex;align-items:center;justify-content:center;gap:7px;position:relative;isolation:isolate;overflow:hidden;min-height:36px;padding:7px 13px;border:1px solid var(--sa-line);border-radius:2px;background:var(--sa-raised);color:var(--sa-ink);font-size:12px!important;letter-spacing:1px;transition:border-color .25s,box-shadow .25s}\r\n#shushan-community-preview .sa-button svg{width:14px;height:14px}\r\n#shushan-community-preview .sa-button:hover:not(:disabled){border-color:var(--sa-gold);box-shadow:0 0 calc(14px * var(--sa-glow)) color-mix(in srgb,var(--sa-jade) 16%,transparent)}\r\n#shushan-community-preview .sa-button:before{content:\"\";position:absolute;inset:0;pointer-events:none;background:linear-gradient(110deg,transparent 30%,color-mix(in srgb,var(--sa-jade) 15%,transparent),transparent 65%);transform:translateX(-110%);transition:transform .7s}\r\n#shushan-community-preview .sa-button:hover:before{transform:translateX(110%)}\r\n#shushan-community-preview .sa-button-primary{background:var(--sa-jade);color:#102a30!important;border-color:var(--sa-jade)}\r\n#shushan-community-preview .sa-content{padding:27px 28px 29px;background:radial-gradient(ellipse at 100% 0,color-mix(in srgb,var(--sa-jade) 6%,transparent),transparent 70%),var(--sa-paper)}\r\n#shushan-community-preview .sa-page-head{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;margin-bottom:23px}\r\n#shushan-community-preview .sa-page-head h3{font:28px/1.5 var(--sa-serif);letter-spacing:4px;margin:7px 0 5px}\r\n#shushan-community-preview .sa-page-head p{font:12px/1.8 var(--sa-serif);color:var(--sa-soft)}\r\n#shushan-community-preview .sa-page-number{font:35px/1 var(--sa-serif);color:color-mix(in srgb,var(--sa-gold) 55%,var(--sa-line));letter-spacing:2px;white-space:nowrap}\r\n#shushan-community-preview .sa-task-filters{display:flex;gap:20px;border-bottom:1px solid var(--sa-line);margin-bottom:19px}\r\n#shushan-community-preview .sa-filter{padding:5px 0 10px;border:0;border-bottom:1px solid transparent;background:transparent;color:var(--sa-soft)!important;font-size:12px!important}\r\n#shushan-community-preview .sa-filter[aria-pressed=true]{color:var(--sa-gold)!important;border-bottom-color:var(--sa-gold)}\r\n#shushan-community-preview .sa-tasks{display:grid;gap:17px}\r\n#shushan-community-preview .sa-task{position:relative;border:1px solid var(--sa-line);background:var(--sa-raised);padding:20px 21px 19px 30px;isolation:isolate;box-shadow:3px 4px 0 color-mix(in srgb,var(--sa-line) 22%,transparent)}\r\n#shushan-community-preview .sa-task:before{content:\"\";position:absolute;left:8px;top:12px;bottom:12px;width:4px;border-left:1px solid var(--sa-line);border-right:1px solid color-mix(in srgb,var(--sa-gold) 50%,transparent)}\r\n#shushan-community-preview .sa-task-top{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:11px}\r\n#shushan-community-preview .sa-task-top h4{font:20px var(--sa-serif);letter-spacing:2px}\r\n#shushan-community-preview .sa-task-id{font-size:11px;letter-spacing:2px;color:var(--sa-faint)}\r\n#shushan-community-preview .sa-task-desc{color:var(--sa-soft);font-size:12px;max-width:88%;margin-bottom:15px!important}\r\n#shushan-community-preview .sa-task-bottom{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;border-top:1px solid var(--sa-line);padding-top:13px}\r\n#shushan-community-preview .sa-task-reward{color:var(--sa-gold);font-size:12px;letter-spacing:1px}\r\n#shushan-community-preview .sa-task-actions{display:flex;gap:8px;flex-wrap:wrap}\r\n#shushan-community-preview .sa-stamp{position:absolute;right:20px;top:53px;display:grid;place-items:center;width:39px;height:42px;font:22px var(--sa-serif);color:var(--sa-red);border:2px solid currentColor;outline:1px solid currentColor;outline-offset:-6px;transform:rotate(-9deg);opacity:.65;background:var(--sa-raised);pointer-events:none}\r\n#shushan-community-preview .sa-stamp.sa-new-stamp{animation:sa-stamp-land .65s cubic-bezier(.2,.8,.2,1) both}\r\n#shushan-community-preview .sa-task-empty{padding:25px 0;color:var(--sa-soft);font-family:var(--sa-serif)}\r\n#shushan-community-preview .sa-course{display:grid;grid-template-columns:53px minmax(0,1fr);gap:18px;padding:21px 0;border-top:1px solid var(--sa-line)}\r\n#shushan-community-preview .sa-course-time{display:flex;flex-direction:column;color:var(--sa-gold);font:24px/1.2 var(--sa-serif);border-right:1px solid var(--sa-line);gap:7px}\r\n#shushan-community-preview .sa-course-time small{font:11px var(--sa-sans);color:var(--sa-faint)}\r\n#shushan-community-preview .sa-course h4{font:20px/1.5 var(--sa-serif);letter-spacing:2px;margin-bottom:6px}\r\n#shushan-community-preview .sa-course p{font-size:12px;color:var(--sa-soft);margin-bottom:12px}\r\n#shushan-community-preview .sa-library{display:grid;grid-template-columns:1fr 1fr;gap:18px}\r\n#shushan-community-preview .sa-tome{position:relative;display:grid;grid-template-columns:38px minmax(0,1fr);gap:14px;padding:21px 17px 20px 14px;border:1px solid var(--sa-line);background:var(--sa-raised);box-shadow:3px 3px 0 color-mix(in srgb,var(--sa-line) 30%,transparent)}\r\n#shushan-community-preview .sa-tome-spine{position:relative;border-right:1px solid var(--sa-gold);font:21px/1.3 var(--sa-serif);letter-spacing:7px;writing-mode:vertical-rl;color:var(--sa-gold);padding:4px 9px 4px 0}\r\n#shushan-community-preview .sa-tome h4{font:19px/1.6 var(--sa-serif);letter-spacing:2px;margin-bottom:9px}\r\n#shushan-community-preview .sa-tome p{font-size:12px;color:var(--sa-soft);margin-bottom:15px}\r\n#shushan-community-preview .sa-tome .sa-button{letter-spacing:0;padding-inline:9px}\r\n#shushan-community-preview .sa-open-book{position:relative;margin-top:23px;display:grid;grid-template-columns:1fr 1fr;background:var(--sa-raised);border:1px solid var(--sa-gold);box-shadow:0 8px 20px color-mix(in srgb,var(--sa-ink) 8%,transparent);transform-origin:0 50%;animation:sa-book-unfold .65s ease-out both}\r\n#shushan-community-preview .sa-book-page{padding:24px 22px;position:relative;min-width:0}\r\n#shushan-community-preview .sa-book-page:first-child{border-right:1px solid var(--sa-gold);background:linear-gradient(90deg,transparent 85%,color-mix(in srgb,var(--sa-gold) 12%,transparent))}\r\n#shushan-community-preview .sa-book-page h4{font:22px var(--sa-serif);letter-spacing:3px;margin-bottom:14px}\r\n#shushan-community-preview .sa-book-page p{font:14px/2.1 var(--sa-serif);color:var(--sa-soft)}\r\n#shushan-community-preview .sa-book-formula{font:20px/2.2 var(--sa-serif)!important;color:var(--sa-gold)!important;text-align:center;letter-spacing:4px;margin-top:17px!important}\r\n#shushan-community-preview .sa-book-page .sa-button{margin-top:14px}\r\n#shushan-community-preview .sa-ledger{display:grid;grid-template-columns:155px minmax(0,1fr);border:1px solid var(--sa-line);background:var(--sa-raised)}\r\n#shushan-community-preview .sa-jade-area{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;padding:27px 15px;border-right:1px solid var(--sa-line);perspective:600px;background:radial-gradient(ellipse at 50% 45%,color-mix(in srgb,var(--sa-jade) 14%,transparent),transparent 70%)}\r\n#shushan-community-preview .sa-jade-token{position:relative;display:flex;align-items:center;justify-content:center;width:77px;height:132px;border:1px solid var(--sa-gold);border-radius:6px 6px 24px 24px;transform:rotateY(-12deg) rotateZ(-3deg);color:#34696c;background:linear-gradient(110deg,#bedbd0,#e4eddb 40%,#9ebfb6);box-shadow:9px 11px 16px color-mix(in srgb,var(--sa-deep) 20%,transparent),inset 0 0 13px #edf7e6;transition:transform .6s}\r\n#shushan-community-preview .sa-jade-token:before{content:\"\";position:absolute;inset:6px;border:1px solid #729e91;border-radius:3px 3px 19px 19px}\r\n#shushan-community-preview .sa-jade-token:after{content:\"\";position:absolute;top:9px;left:33px;width:9px;height:9px;border-radius:50%;background:var(--sa-raised);border:1px solid #729e91}\r\n#shushan-community-preview .sa-jade-token span{font:28px/1.45 var(--sa-serif);writing-mode:vertical-rl;letter-spacing:7px;margin-top:13px}\r\n#shushan-community-preview .sa-jade-area:hover .sa-jade-token{transform:rotateY(10deg) rotateZ(2deg) translateY(-4px)}\r\n#shushan-community-preview .sa-jade-area>span{font:13px var(--sa-serif);letter-spacing:4px;color:var(--sa-gold)}\r\n#shushan-community-preview .sa-ledger-fields{padding:22px 24px}\r\n#shushan-community-preview .sa-ledger-fields h4{font:26px var(--sa-serif);letter-spacing:4px}\r\n#shushan-community-preview .sa-facts{display:grid;grid-template-columns:1fr 1fr;gap:16px 22px;margin:21px 0 0}\r\n#shushan-community-preview .sa-facts div{border-bottom:1px solid var(--sa-line);padding-bottom:10px;min-width:0}\r\n#shushan-community-preview .sa-facts dt{font-size:11px;color:var(--sa-faint);letter-spacing:2px}\r\n#shushan-community-preview .sa-facts dd{font-size:13px;margin:5px 0 0;color:var(--sa-ink)}\r\n#shushan-community-preview .sa-background-note{font:13px/2 var(--sa-serif);color:var(--sa-soft);margin-top:20px!important}\r\n#shushan-community-preview .sa-following{display:flex;gap:13px;align-items:center;justify-content:space-between;padding:15px 26px;border-top:1px solid var(--sa-line);background:var(--sa-deep);font-size:12px}\r\n#shushan-community-preview .sa-following-label{color:var(--sa-gold);letter-spacing:2px;white-space:nowrap}\r\n#shushan-community-preview .sa-following-name{flex:1;color:var(--sa-soft);min-width:0}\r\n#shushan-community-preview .sa-following button{background:transparent;border:0;color:var(--sa-gold);font-size:12px!important;padding:3px 0;white-space:nowrap}\r\n#shushan-community-preview .sa-request{padding:18px 26px 23px;border-top:1px solid var(--sa-line);background:var(--sa-raised)}\r\n#shushan-community-preview .sa-request-head{display:flex;align-items:center;justify-content:space-between;gap:13px;margin-bottom:9px}\r\n#shushan-community-preview .sa-request label{color:var(--sa-gold);font-size:12px;letter-spacing:2px}\r\n#shushan-community-preview .sa-request-head button{border:0;background:transparent;color:var(--sa-soft);font-size:12px!important;padding:4px}\r\n#shushan-community-preview .sa-request textarea{display:block;resize:vertical;width:100%;min-height:87px;border:1px solid var(--sa-line);background:var(--sa-paper);border-radius:2px;padding:11px 13px;color:var(--sa-ink);font-size:14px;line-height:1.8}\r\n#shushan-community-preview .sa-foot{padding:11px 25px;display:flex;align-items:center;justify-content:space-between;gap:12px;color:var(--sa-faint);font-size:11px;letter-spacing:2px;background:var(--sa-paper);border-top:1px solid var(--sa-line)}\r\n#shushan-community-preview .sa-feedback{min-height:0;position:relative;margin:0;padding:0;font-size:12px;color:var(--sa-gold);background:var(--sa-deep)}\r\n#shushan-community-preview .sa-feedback:not(:empty){padding:11px 26px;border-top:1px solid var(--sa-line);animation:sa-message-in .3s ease-out both}\r\n#shushan-community-preview .sa-page-in{animation:sa-page-in .42s ease-out both}\r\n#shushan-community-preview .sa-sword-sweep{position:absolute;left:-40%;width:35%;height:1px;top:0;pointer-events:none;background:linear-gradient(90deg,transparent,var(--sa-jade),var(--sa-gold),transparent);box-shadow:0 0 calc(12px * var(--sa-glow)) var(--sa-jade);animation:sa-sword-pass .7s ease-out both;z-index:8}\r\n#shushan-community-preview .sa-ceremony{position:absolute;inset:0;z-index:20;display:grid;place-items:start center;padding:75px 25px 40px;text-align:center;background:var(--sa-deep);overflow:hidden;animation:sa-message-in .4s ease-out both}\r\n#shushan-community-preview .sa-ceremony-inner{position:relative;display:flex;flex-direction:column;align-items:center;width:100%;max-width:450px}\r\n#shushan-community-preview .sa-ceremony-kicker{font-size:11px;letter-spacing:5px;color:var(--sa-gold);margin-bottom:22px!important}\r\n#shushan-community-preview .sa-ceremony h3{font:34px/1.6 var(--sa-serif);letter-spacing:9px;color:var(--sa-ink);margin-top:18px}\r\n#shushan-community-preview .sa-ceremony-words{font:13px/2 var(--sa-serif);color:var(--sa-soft);margin:15px 0 25px!important;letter-spacing:2px;animation:sa-ceremony-text 1.7s ease-out both}\r\n#shushan-community-preview .sa-ceremony .sa-button{animation:sa-ceremony-text 1.8s ease-out both}\r\n#shushan-community-preview .sa-formation{width:270px;height:270px;position:relative;display:grid;place-items:center;perspective:600px}\r\n#shushan-community-preview .sa-formation-ring{position:absolute;inset:16px;border:1px solid var(--sa-jade);border-radius:50%;transform:rotateX(44deg) rotate(-25deg);box-shadow:0 0 calc(18px * var(--sa-glow)) color-mix(in srgb,var(--sa-jade) 18%,transparent);animation:sa-ring-awake 1.5s ease-out both}\r\n#shushan-community-preview .sa-formation-ring:nth-child(2){inset:32px;border-style:dashed;transform:rotateX(-35deg) rotate(25deg);animation-delay:.12s}\r\n#shushan-community-preview .sa-formation-ring:nth-child(3){inset:55px;border-color:var(--sa-gold);transform:rotateX(0deg) rotate(-20deg);animation-delay:.24s}\r\n#shushan-community-preview .sa-formation-word{position:absolute;left:50%;top:50%;color:var(--sa-gold);font:12px var(--sa-serif);transform:translate(-50%,-50%) rotate(var(--a)) translateY(-119px) rotate(calc(-1 * var(--a)));animation:sa-ceremony-text 1.5s ease-out both}\r\n#shushan-community-preview .sa-blade{position:relative;width:17px;height:144px;margin-top:-23px;background:linear-gradient(90deg,var(--sa-jade),var(--sa-ink) 46%,var(--sa-jade) 51%,var(--sa-gold));clip-path:polygon(50% 0,100% 17%,81% 91%,50% 100%,19% 91%,0 17%);filter:drop-shadow(0 0 9px var(--sa-jade));animation:sa-blade-rise 1.3s cubic-bezier(.2,.8,.2,1) both}\r\n#shushan-community-preview .sa-sword-hilt{position:absolute;top:188px;width:75px;height:6px;background:var(--sa-gold);transform:perspective(150px) rotateX(-15deg);box-shadow:0 0 calc(18px * var(--sa-glow)) color-mix(in srgb,var(--sa-gold) 35%,transparent);animation:sa-ceremony-text 1.1s both}\r\n#shushan-community-preview .sa-sword-hilt:after{content:\"\";position:absolute;left:33px;top:6px;width:9px;height:34px;background:repeating-linear-gradient(0deg,var(--sa-gold) 0 2px,var(--sa-rock) 2px 7px);border-radius:0 0 4px 4px}\r\n#shushan-community-preview .sa-no-motion *,#shushan-community-preview .sa-no-motion *:before,#shushan-community-preview .sa-no-motion *:after{animation-duration:.001ms!important;animation-delay:0ms!important;transition-duration:.001ms!important}\r\n@keyframes sa-route-draw{from{stroke-dashoffset:1200;opacity:.2}to{stroke-dashoffset:0;opacity:1}}\r\n@keyframes sa-stamp-land{0%{transform:rotate(-18deg) scale(2.2);opacity:0}65%{transform:rotate(-9deg) scale(.93);opacity:.85}100%{transform:rotate(-9deg) scale(1);opacity:.65}}\r\n@keyframes sa-book-unfold{from{transform:perspective(900px) rotateY(-15deg);opacity:.2}to{transform:perspective(900px) rotateY(0);opacity:1}}\r\n@keyframes sa-message-in{from{opacity:0}to{opacity:1}}\r\n@keyframes sa-page-in{from{transform:translateY(8px);opacity:.3}to{transform:translateY(0);opacity:1}}\r\n@keyframes sa-sword-pass{from{left:-40%;opacity:0}20%{opacity:1}to{left:110%;opacity:0}}\r\n@keyframes sa-ring-awake{from{opacity:0;scale:.4;rotate:-65deg}65%{opacity:1;scale:1.04}to{opacity:.8;scale:1;rotate:0deg}}\r\n@keyframes sa-ceremony-text{0%,40%{opacity:0;translate:0 9px}100%{opacity:1;translate:0 0}}\r\n@keyframes sa-blade-rise{0%{transform:translateY(50px) scaleY(.3);opacity:0}100%{transform:translateY(0) scaleY(1);opacity:1}}\r\n@container (max-width:620px){#shushan-community-preview .sa-head{padding:17px 19px;gap:11px}#shushan-community-preview .sa-brand h2{font-size:23px;letter-spacing:3px}#shushan-community-preview .sa-subtitle{letter-spacing:0}#shushan-community-preview .sa-credit{padding-right:10px;gap:7px}#shushan-community-preview .sa-credit strong{font-size:25px}#shushan-community-preview .sa-seal{width:38px;height:47px;font-size:23px}#shushan-community-preview .sa-nav{padding:0 8px}#shushan-community-preview .sa-tab{font-size:11px!important;letter-spacing:0;gap:4px}#shushan-community-preview .sa-tab svg{display:none}#shushan-community-preview .sa-atlas{height:408px}#shushan-community-preview .sa-map-caption{left:22px;top:22px}#shushan-community-preview .sa-map-caption h3{font-size:27px}#shushan-community-preview .sa-peak-detail{padding:22px;gap:15px;grid-template-columns:1fr}#shushan-community-preview .sa-detail-side{flex-direction:row;align-items:center;justify-content:space-between;border-left:0;border-top:1px solid var(--sa-line);padding:13px 0 0}#shushan-community-preview .sa-content{padding:23px 21px}#shushan-community-preview .sa-library{grid-template-columns:1fr}#shushan-community-preview .sa-ledger{grid-template-columns:113px 1fr}#shushan-community-preview .sa-ledger-fields{padding:20px 17px}#shushan-community-preview .sa-jade-token{width:68px;height:120px}#shushan-community-preview .sa-jade-token:after{left:28px}#shushan-community-preview .sa-facts{gap:13px 15px}#shushan-community-preview .sa-following,#shushan-community-preview .sa-request{padding-inline:21px}#shushan-community-preview .sa-peak-name{font-size:14px;letter-spacing:1px}#shushan-community-preview .sa-peak-button{min-width:68px;padding:7px}#shushan-community-preview .sa-map-bottom{left:21px;right:21px}#shushan-community-preview .sa-map-bottom span:last-child{letter-spacing:1px}}\r\n@container (max-width:460px){#shushan-community-preview .sa-head{gap:10px;padding:16px 15px}#shushan-community-preview .sa-seal{display:none}#shushan-community-preview .sa-brand h2{font-size:22px}#shushan-community-preview .sa-credit{gap:7px}#shushan-community-preview .sa-collapse{font-size:11px!important}#shushan-community-preview .sa-atlas{height:395px;padding-top:205px;background:var(--sa-sky)}#shushan-community-preview .sa-art{height:267px;top:0;bottom:auto;transform:scale(1.025)}#shushan-community-preview .sa-map-caption{max-width:80%;top:18px;left:18px}#shushan-community-preview .sa-map-caption h3{font-size:26px;margin-top:6px}#shushan-community-preview .sa-map-caption p{font-size:11px}#shushan-community-preview .sa-map-north{right:17px;top:20px;font-size:11px}#shushan-community-preview .sa-map-nodes{position:relative;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px;margin:0 16px}#shushan-community-preview .sa-peak-button{position:relative;left:auto;top:auto;transform:none;width:100%;min-width:0;padding:10px 3px;gap:5px;background:var(--sa-raised)}#shushan-community-preview .sa-peak-button:hover,#shushan-community-preview .sa-peak-button:focus-visible{transform:translateY(-2px)}#shushan-community-preview .sa-peak-button:before,#shushan-community-preview .sa-peak-button:after{display:none}#shushan-community-preview .sa-peak-tag{font-size:11px}#shushan-community-preview .sa-map-bottom{left:17px;right:17px;bottom:13px}#shushan-community-preview .sa-map-bottom span:last-child{display:none}#shushan-community-preview .sa-map-array{opacity:.15}#shushan-community-preview .sa-nav{padding:0 5px;flex-wrap:wrap}#shushan-community-preview .sa-tab{padding:13px 3px;min-width:50px}#shushan-community-preview .sa-peak-detail{padding:20px 17px}#shushan-community-preview .sa-peak-poem{font-size:13px;letter-spacing:0}#shushan-community-preview .sa-content{padding:21px 16px}#shushan-community-preview .sa-page-head{gap:8px}#shushan-community-preview .sa-page-head h3{font-size:26px;letter-spacing:3px}#shushan-community-preview .sa-page-number{font-size:28px}#shushan-community-preview .sa-task{padding:17px 16px 17px 25px}#shushan-community-preview .sa-task-top h4{font-size:18px;letter-spacing:1px}#shushan-community-preview .sa-task-id{letter-spacing:0}#shushan-community-preview .sa-task-desc{max-width:88%}#shushan-community-preview .sa-stamp{right:12px;top:51px;width:32px;height:36px;font-size:19px}#shushan-community-preview .sa-task-bottom{align-items:flex-start}#shushan-community-preview .sa-task-actions{gap:6px}#shushan-community-preview .sa-button{padding:7px 10px;letter-spacing:0}#shushan-community-preview .sa-ledger{grid-template-columns:1fr}#shushan-community-preview .sa-jade-area{flex-direction:row;border-right:0;border-bottom:1px solid var(--sa-line);padding:20px;gap:23px}#shushan-community-preview .sa-jade-token{height:103px;width:61px}#shushan-community-preview .sa-jade-token span{font-size:23px;letter-spacing:4px}#shushan-community-preview .sa-jade-token:after{left:25px;top:9px;width:7px;height:7px}#shushan-community-preview .sa-jade-area>span{writing-mode:vertical-rl;letter-spacing:6px}#shushan-community-preview .sa-ledger-fields h4{font-size:24px}#shushan-community-preview .sa-open-book{grid-template-columns:1fr}#shushan-community-preview .sa-book-page{padding:21px 18px}#shushan-community-preview .sa-book-page:first-child{border-right:0;border-bottom:1px solid var(--sa-gold)}#shushan-community-preview .sa-course{gap:13px;grid-template-columns:45px 1fr}#shushan-community-preview .sa-following{padding:13px 16px;gap:9px;flex-wrap:wrap}#shushan-community-preview .sa-following-label{letter-spacing:1px}#shushan-community-preview .sa-following-name{min-width:120px}#shushan-community-preview .sa-request{padding:17px 16px}#shushan-community-preview .sa-foot{padding:11px 16px;letter-spacing:1px;font-size:11px}#shushan-community-preview .sa-foot span:last-child{display:none}#shushan-community-preview .sa-feedback:not(:empty){padding:11px 16px}#shushan-community-preview .sa-ceremony{padding-top:45px}#shushan-community-preview .sa-ceremony h3{font-size:29px;letter-spacing:5px}#shushan-community-preview .sa-formation{width:245px;height:245px}#shushan-community-preview .sa-formation-word{transform:translate(-50%,-50%) rotate(var(--a)) translateY(-107px) rotate(calc(-1 * var(--a)))}#shushan-community-preview .sa-sword-hilt{top:175px}}\r\n@media(pointer:coarse){#shushan-community-preview .sa-button,#shushan-community-preview .sa-tab,#shushan-community-preview .sa-collapse,#shushan-community-preview .sa-filter,#shushan-community-preview .sa-following button,#shushan-community-preview .sa-request-head button{min-height:44px}#shushan-community-preview .sa-request textarea{font-size:16px}}\r\n@media(prefers-reduced-motion:reduce){#shushan-community-preview *,#shushan-community-preview *:before,#shushan-community-preview *:after{animation-duration:.001ms!important;animation-delay:0ms!important;transition-duration:.001ms!important}#shushan-community-preview .sa-art{transform:none!important}}\r\n#shushan-community-preview .sa-shell{color-scheme:dark}\r\n#shushan-community-preview .sa-nav{display:grid;grid-template-columns:repeat(var(--sa-tab-count,7),minmax(0,1fr));padding-inline:15px}\r\n#shushan-community-preview .sa-nav .sa-tab{flex:1 1 100px}\r\n#shushan-community-preview .sa-tab{letter-spacing:0;gap:5px;min-width:0}\r\n#shushan-community-preview .sa-page-head{align-items:center}\r\n#shushan-community-preview .sa-page-head p{max-width:42em}\r\n#shushan-community-preview .sa-living-date{display:flex;flex-direction:column;align-items:flex-end;gap:5px;flex:none;color:var(--sa-gold);font:15px/1.5 var(--sa-serif);letter-spacing:2px}\r\n#shushan-community-preview .sa-living-date small{font:11px var(--sa-sans);color:var(--sa-faint);letter-spacing:1px}\r\n#shushan-community-preview .sa-news-feature{position:relative;padding:22px 24px;background:var(--sa-raised);border:1px solid var(--sa-line);box-shadow:3px 4px 0 color-mix(in srgb,var(--sa-line) 18%,transparent)}\r\n#shushan-community-preview .sa-news-feature:before{content:\"\";position:absolute;left:9px;top:12px;bottom:12px;width:4px;border-left:1px solid var(--sa-line);border-right:1px solid var(--sa-gold);opacity:.65}\r\n#shushan-community-preview .sa-news-meta{display:flex;align-items:center;justify-content:space-between;gap:9px;flex-wrap:wrap;color:var(--sa-faint);font-size:11px;margin-bottom:13px}\r\n#shushan-community-preview .sa-news-meta>span:first-child{color:var(--sa-gold);letter-spacing:2px}\r\n#shushan-community-preview .sa-news-feature h4{font:24px/1.5 var(--sa-serif);letter-spacing:3px;margin-bottom:9px}\r\n#shushan-community-preview .sa-news-feature p{font-size:13px;line-height:1.95;color:var(--sa-soft)}\r\n#shushan-community-preview .sa-news-feature details{margin-top:16px;border-top:1px solid var(--sa-line);padding-top:11px}\r\n#shushan-community-preview .sa-news-feature summary{display:list-item;list-style-position:inside;font-size:12px;color:var(--sa-gold)}\r\n#shushan-community-preview .sa-news-feature details p{font:13px/2 var(--sa-serif);margin:13px 0 16px}\r\n#shushan-community-preview .sa-news-list{margin-top:15px}\r\n#shushan-community-preview .sa-news-row{display:grid;grid-template-columns:42px minmax(0,1fr) auto;gap:15px;align-items:center;padding:20px 0;border-bottom:1px solid var(--sa-line)}\r\n#shushan-community-preview .sa-news-row:last-child{border-bottom:0;padding-bottom:1px}\r\n#shushan-community-preview .sa-news-mark{display:grid;place-items:center;width:36px;height:43px;border:1px solid var(--sa-line);color:var(--sa-gold);font:21px var(--sa-serif);background:var(--sa-raised);position:relative}\r\n#shushan-community-preview .sa-news-mark:after{content:\"\";position:absolute;inset:4px;border-top:1px solid color-mix(in srgb,var(--sa-gold) 35%,transparent);border-bottom:1px solid color-mix(in srgb,var(--sa-gold) 35%,transparent)}\r\n#shushan-community-preview .sa-news-row h4{font:19px/1.6 var(--sa-serif);letter-spacing:2px;margin:4px 0 5px}\r\n#shushan-community-preview .sa-news-row p{font-size:12px;color:var(--sa-soft)}\r\n#shushan-community-preview .sa-news-row .sa-news-meta{margin:0;font-size:11px;justify-content:flex-start;gap:12px}\r\n#shushan-community-preview .sa-news-row .sa-button{white-space:nowrap}\r\n#shushan-community-preview .sa-club-tools{display:flex;align-items:center;justify-content:space-between;gap:16px;border-bottom:1px solid var(--sa-line);margin-bottom:20px;flex-wrap:wrap}\r\n#shushan-community-preview .sa-club-tools .sa-task-filters{border:0;margin:0}\r\n#shushan-community-preview .sa-club-tools>.sa-button{margin-bottom:9px}\r\n#shushan-community-preview .sa-club-grid{display:grid;grid-template-columns:1fr 1fr;gap:17px}\r\n#shushan-community-preview .sa-club-card{position:relative;min-width:0;padding:20px;border:1px solid var(--sa-line);background:var(--sa-raised);display:flex;flex-direction:column;transition:border-color .25s,box-shadow .25s}\r\n#shushan-community-preview .sa-club-card:hover{border-color:color-mix(in srgb,var(--sa-gold) 70%,var(--sa-line));box-shadow:0 0 calc(18px * var(--sa-glow)) color-mix(in srgb,var(--sa-jade) 8%,transparent)}\r\n#shushan-community-preview .sa-club-card-head{display:flex;gap:12px;align-items:center;margin-bottom:14px}\r\n#shushan-community-preview .sa-club-emblem{position:relative;flex:none;display:grid;place-items:center;width:39px;height:45px;color:var(--sa-gold);border:1px solid currentColor;border-radius:2px;font:24px var(--sa-serif)}\r\n#shushan-community-preview .sa-club-emblem:after{content:\"\";position:absolute;inset:4px;border:1px solid currentColor;opacity:.3}\r\n#shushan-community-preview .sa-club-card h4{font:19px/1.6 var(--sa-serif);letter-spacing:1px;overflow-wrap:anywhere}\r\n#shushan-community-preview .sa-club-card-type{font-size:11px;color:var(--sa-faint);margin-top:3px}\r\n#shushan-community-preview .sa-club-card p{color:var(--sa-soft);font:13px/1.9 var(--sa-serif);flex:1;margin-bottom:15px}\r\n#shushan-community-preview .sa-club-card-foot{padding-top:12px;border-top:1px solid var(--sa-line);display:flex;align-items:center;justify-content:space-between;gap:9px;flex-wrap:wrap}\r\n#shushan-community-preview .sa-club-card-foot>span{font-size:11px;color:var(--sa-faint)}\r\n#shushan-community-preview .sa-club-card.sa-club-joined{border-color:color-mix(in srgb,var(--sa-gold) 65%,var(--sa-line))}\r\n#shushan-community-preview .sa-empty-clubs{padding:35px 20px;text-align:center;border:1px solid var(--sa-line);background:var(--sa-raised)}\r\n#shushan-community-preview .sa-empty-clubs h4{font:23px/1.6 var(--sa-serif);letter-spacing:3px;color:var(--sa-gold)}\r\n#shushan-community-preview .sa-empty-clubs p{font:13px/2 var(--sa-serif);color:var(--sa-soft);margin:12px 0 22px}\r\n#shushan-community-preview .sa-club-back{display:inline-flex;gap:5px;align-items:center;padding:0 0 12px;border:0;background:transparent;color:var(--sa-soft)!important;font-size:12px!important}\r\n#shushan-community-preview .sa-club-back svg{width:14px;height:14px}\r\n#shushan-community-preview .sa-invitation{position:relative;padding:25px 25px 22px;border:1px solid color-mix(in srgb,var(--sa-gold) 65%,var(--sa-line));background:var(--sa-raised);box-shadow:4px 5px 0 color-mix(in srgb,var(--sa-line) 20%,transparent)}\r\n#shushan-community-preview .sa-invitation:before,#shushan-community-preview .sa-invitation:after{content:\"\";position:absolute;width:22px;height:22px;border-color:var(--sa-gold);border-style:solid;pointer-events:none;opacity:.55}\r\n#shushan-community-preview .sa-invitation:before{left:6px;top:6px;border-width:1px 0 0 1px}\r\n#shushan-community-preview .sa-invitation:after{right:6px;bottom:6px;border-width:0 1px 1px 0}\r\n#shushan-community-preview .sa-invitation-head{display:grid;grid-template-columns:76px minmax(0,1fr);gap:21px;align-items:center;padding-bottom:23px;border-bottom:1px solid var(--sa-line)}\r\n#shushan-community-preview .sa-invitation-emblem{display:flex;flex-direction:column;gap:9px;align-items:center}\r\n#shushan-community-preview .sa-invitation-emblem .sa-club-emblem{width:62px;height:70px;font-size:36px;transform:rotate(-4deg)}\r\n#shushan-community-preview .sa-invitation-emblem>span{color:var(--sa-faint);font-size:11px;letter-spacing:3px}\r\n#shushan-community-preview .sa-invitation h4{font:29px/1.5 var(--sa-serif);letter-spacing:4px;margin:5px 0 8px}\r\n#shushan-community-preview .sa-club-poem{color:var(--sa-gold);font:15px/1.95 var(--sa-serif);letter-spacing:1px}\r\n#shushan-community-preview .sa-club-description{font-size:13px;line-height:1.95;color:var(--sa-soft);margin:19px 0!important}\r\n#shushan-community-preview .sa-club-facts{display:flex;gap:20px 30px;flex-wrap:wrap;margin:18px 0 0}\r\n#shushan-community-preview .sa-club-facts div{display:flex;gap:10px;align-items:baseline;flex-wrap:wrap}\r\n#shushan-community-preview .sa-club-facts dt{font-size:11px;color:var(--sa-faint);letter-spacing:1px}\r\n#shushan-community-preview .sa-club-facts dd{font-size:12px;margin:0;color:var(--sa-ink)}\r\n#shushan-community-preview .sa-club-next{margin-top:23px;padding:18px 20px;border:1px solid var(--sa-line);background:var(--sa-paper)}\r\n#shushan-community-preview .sa-club-next h5{margin:10px 0 7px;font:20px/1.6 var(--sa-serif);letter-spacing:2px;color:var(--sa-ink)}\r\n#shushan-community-preview .sa-club-next p{font-size:12px;color:var(--sa-soft);margin-bottom:14px}\r\n#shushan-community-preview .sa-invitation-actions{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-top:20px}\r\n#shushan-community-preview .sa-quiet-note{font-size:11px;color:var(--sa-faint)}\r\n#shushan-community-preview .sa-membership-mark{position:relative;display:flex;align-items:center;gap:9px;color:var(--sa-gold);font-size:12px}\r\n#shushan-community-preview .sa-small-seal{width:33px;height:36px;display:grid;place-items:center;border:2px solid currentColor;outline:1px solid currentColor;outline-offset:-6px;font:19px var(--sa-serif);color:var(--sa-red);transform:rotate(-8deg)}\r\n#shushan-community-preview .sa-small-seal.sa-new-stamp{animation:sa-stamp-land .65s cubic-bezier(.2,.8,.2,1) both}\r\n#shushan-community-preview .sa-create-form{padding:22px;border:1px solid var(--sa-line);background:var(--sa-raised)}\r\n#shushan-community-preview .sa-form-grid{display:grid;grid-template-columns:1fr 1fr;gap:17px}\r\n#shushan-community-preview .sa-field{display:flex;flex-direction:column;gap:7px;min-width:0;color:var(--sa-soft);font-size:12px}\r\n#shushan-community-preview .sa-field-wide{grid-column:1/-1}\r\n#shushan-community-preview .sa-field input,#shushan-community-preview .sa-field textarea{font:14px/1.75 var(--sa-sans);width:100%;min-width:0;padding:9px 11px;border:1px solid var(--sa-line);border-radius:2px;background:var(--sa-paper);color:var(--sa-ink)}\r\n#shushan-community-preview .sa-field textarea{min-height:82px;resize:vertical}\r\n#shushan-community-preview .sa-field small{font-size:11px;color:var(--sa-faint)}\r\n#shushan-community-preview .sa-create-form>.sa-button{margin-top:19px}\r\n#shushan-community-preview .sa-form-error{font-size:12px;color:var(--sa-red);margin-top:13px}\r\n#shushan-community-preview .sa-invite-open{transform-origin:0 50%;animation:sa-book-unfold .5s ease-out both}\r\n#shushan-community-preview .sa-ceremony .sa-jade-token{width:87px;height:142px;z-index:2;margin-top:-5px;animation:sa-blade-rise 1.3s ease-out both}\r\n#shushan-community-preview .sa-ceremony .sa-jade-token:after{left:38px}\r\n#shushan-community-preview .sa-ceremony .sa-jade-token span{font-size:29px}\r\n@container (max-width:620px){#shushan-community-preview .sa-nav{grid-template-columns:repeat(3,minmax(0,1fr));padding-inline:11px}#shushan-community-preview .sa-tab{font-size:12px!important}#shushan-community-preview .sa-club-card{padding:17px}#shushan-community-preview .sa-club-card h4{font-size:18px}#shushan-community-preview .sa-club-card-head{gap:9px}#shushan-community-preview .sa-club-emblem{width:34px;height:40px;font-size:22px}#shushan-community-preview .sa-news-row{grid-template-columns:35px minmax(0,1fr);gap:12px}#shushan-community-preview .sa-news-row>.sa-button{grid-column:2;justify-self:start}#shushan-community-preview .sa-news-feature{padding:20px 20px 20px 24px}#shushan-community-preview .sa-news-feature h4{font-size:22px}#shushan-community-preview .sa-invitation{padding:23px 20px}#shushan-community-preview .sa-invitation-head{gap:14px;grid-template-columns:62px minmax(0,1fr)}#shushan-community-preview .sa-invitation h4{font-size:26px;letter-spacing:2px}#shushan-community-preview .sa-living-date{font-size:13px;letter-spacing:1px}#shushan-community-preview .sa-living-date small{letter-spacing:0}#shushan-community-preview .sa-club-next{padding:16px}}\r\n@container (max-width:460px){#shushan-community-preview .sa-club-grid,#shushan-community-preview .sa-form-grid{grid-template-columns:1fr}#shushan-community-preview .sa-club-card h4{font-size:20px}#shushan-community-preview .sa-club-card-head{gap:13px}#shushan-community-preview .sa-club-tools{gap:9px}#shushan-community-preview .sa-club-tools .sa-task-filters{gap:17px}#shushan-community-preview .sa-club-tools>.sa-button{margin-bottom:10px}#shushan-community-preview .sa-invitation{padding:23px 16px 19px}#shushan-community-preview .sa-invitation-head{grid-template-columns:48px minmax(0,1fr);gap:13px}#shushan-community-preview .sa-invitation-emblem .sa-club-emblem{width:42px;height:51px;font-size:27px}#shushan-community-preview .sa-invitation-emblem>span{letter-spacing:1px}#shushan-community-preview .sa-invitation h4{font-size:23px;letter-spacing:1px}#shushan-community-preview .sa-club-poem{font-size:13px;letter-spacing:0}#shushan-community-preview .sa-club-description{font-size:12px}#shushan-community-preview .sa-club-next{padding:16px 13px}#shushan-community-preview .sa-club-next h5{font-size:18px;letter-spacing:1px}#shushan-community-preview .sa-club-facts{gap:12px}#shushan-community-preview .sa-create-form{padding:19px 16px}#shushan-community-preview .sa-page-head h3{font-size:25px;letter-spacing:2px}#shushan-community-preview .sa-living-date{font-size:12px;letter-spacing:0}#shushan-community-preview .sa-news-feature h4{font-size:21px;letter-spacing:1px}#shushan-community-preview .sa-news-meta{line-height:1.6}#shushan-community-preview .sa-news-row h4{font-size:18px;letter-spacing:1px}#shushan-community-preview .sa-news-feature p{font-size:12px}#shushan-community-preview .sa-news-mark{width:32px;height:39px;font-size:20px}#shushan-community-preview .sa-club-back{min-height:36px}}\r\n@media(pointer:coarse){#shushan-community-preview .sa-field input,#shushan-community-preview .sa-field textarea{font-size:16px}#shushan-community-preview .sa-news-feature summary,#shushan-community-preview .sa-club-back{min-height:44px}}\r\n\r\n\r\n#shushan-community-preview{container-type:inline-size;width:100%;color-scheme:dark}#shushan-community-preview .sa-task-filters{flex-wrap:wrap}#shushan-community-preview .sa-actions{margin-top:20px;display:flex;gap:9px;flex-wrap:wrap}#shushan-community-preview .sa-task-progress{font-size:12px;color:var(--sa-soft);margin:10px 0 16px}#shushan-community-preview .sa-quantity{display:flex;align-items:center;gap:9px;margin:10px 0;font-size:12px;color:var(--sa-soft)}#shushan-community-preview .sa-quantity input{width:65px;background:var(--sa-paper);color:var(--sa-ink);border:1px solid var(--sa-line);padding:5px;font:14px var(--sa-sans)}#shushan-community-preview .sa-gold{color:var(--sa-gold)}#shushan-community-preview .sa-borrowed{margin-top:20px;border-top:1px solid var(--sa-line);padding-top:17px}#shushan-community-preview .sa-borrowed h4{font:21px var(--sa-serif)}#shushan-community-preview .sa-borrow-row{display:flex;gap:12px;justify-content:space-between;align-items:center;flex-wrap:wrap;padding:13px 0;font-size:12px;color:var(--sa-soft)}#shushan-community-preview .sa-tome div{min-width:0}#shushan-community-preview .sa-living-date{max-width:38%;overflow-wrap:anywhere}#shushan-community-preview .sa-course-time{font-size:16px;overflow-wrap:anywhere}#shushan-community-preview .sa-news-feature>.sa-button{margin-top:15px}#shushan-community-preview .sa-news-row details p{margin-top:12px}#shushan-community-preview .sa-task-empty .sa-button{margin-top:16px}\r\n#shushan-community-preview .sa-exchange{grid-template-columns:42px minmax(0,1fr)}#shushan-community-preview .sa-exchange-mark{display:grid;place-items:center;height:48px;width:36px;border:1px solid var(--sa-gold);outline:1px solid color-mix(in srgb,var(--sa-gold) 30%,transparent);outline-offset:-5px;color:var(--sa-gold);font:25px var(--sa-serif)}\r\n\n#shushan-community-preview .sa-calendar-strip{display:flex;gap:28px;flex-wrap:wrap;padding:0 0 20px;border-bottom:1px solid var(--sa-line);color:var(--sa-gold)}\n#shushan-community-preview .sa-season{display:grid;grid-template-columns:68px minmax(0,1fr) 66px;gap:25px;padding:26px 0;border-bottom:1px solid var(--sa-line)}\n#shushan-community-preview .sa-season-date{display:flex;flex-direction:column;align-items:center;border-right:1px solid var(--sa-line);padding-right:15px;color:var(--sa-gold)}\n#shushan-community-preview .sa-season-date strong{font-size:35px;font-weight:400;line-height:1.2}#shushan-community-preview .sa-season-date span{font-size:12px;white-space:nowrap}\n#shushan-community-preview .sa-season h4,#shushan-community-preview .sa-office h4,#shushan-community-preview .sa-office-current h4{font-size:21px;font-weight:400;margin:9px 0;color:var(--sa-ink)}#shushan-community-preview .sa-season p,#shushan-community-preview .sa-office p,#shushan-community-preview .sa-office-current p{line-height:1.9;color:var(--sa-soft);margin:8px 0;overflow-wrap:anywhere}\n#shushan-community-preview .sa-season-count{display:flex;align-items:center;flex-direction:column;color:var(--sa-gold);justify-content:center}#shushan-community-preview .sa-season-count strong{font-weight:400;font-size:30px}#shushan-community-preview .sa-season-count span{font-size:11px;white-space:nowrap}\n#shushan-community-preview .sa-office-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:15px}#shushan-community-preview .sa-office{padding:20px;border:1px solid var(--sa-line);background:var(--sa-raised)}#shushan-community-preview .sa-office-current{padding:24px;margin:0 0 24px;border-left:2px solid var(--sa-gold);background:var(--sa-raised)}\n@container(max-width:620px){#shushan-community-preview .sa-nav .sa-tab{flex-basis:27%}#shushan-community-preview .sa-season{gap:12px;grid-template-columns:44px minmax(0,1fr)}#shushan-community-preview .sa-season-count{grid-column:2;flex-direction:row;justify-content:flex-start;gap:8px}#shushan-community-preview .sa-season-date{padding-right:7px}#shushan-community-preview .sa-season-date strong{font-size:28px}#shushan-community-preview .sa-office-grid{grid-template-columns:1fr}#shushan-community-preview .sa-office-current{padding:18px}}\n\n#shushan-community-preview .sa-lock{font-size:10px;color:var(--sa-gold);border:1px solid var(--sa-line);padding:0 3px;line-height:1.4}\n#shushan-community-preview .sa-tab:disabled{opacity:.55;background:transparent}\n#shushan-community-preview .sa-settings-toggle{flex:none;border:1px solid var(--sa-line);border-radius:4px;background:var(--sa-raised);color:var(--sa-soft);padding:7px 9px;font:inherit;font-size:12px}\n#shushan-community-preview .sa-settings{padding:24px 28px;background:var(--sa-deep);border-bottom:1px solid var(--sa-line)}\n#shushan-community-preview .sa-settings .sa-form-grid{margin:18px 0}\n#shushan-community-preview .sa-settings input,#shushan-community-preview .sa-settings select{box-sizing:border-box;min-width:0;max-width:100%;width:100%;padding:9px 10px;color:var(--sa-ink);background:var(--sa-paper);border:1px solid var(--sa-line);font:inherit}\n#shushan-community-preview .sa-update-check{display:flex;align-items:center;gap:8px;color:var(--sa-soft)}\n#shushan-community-preview .sa-update-check input{width:auto}\n#shushan-community-preview .sa-reset-toggle{display:inline-flex;align-items:center;justify-content:center;flex-shrink:0;width:40px;height:40px;min-width:40px;padding:0;border:1px solid var(--sa-line);border-radius:4px;color:var(--sa-soft);background:transparent;cursor:pointer;transition:color .2s,border-color .2s,background .2s}\n#shushan-community-preview .sa-reset-toggle:hover{color:var(--sa-jade);border-color:var(--sa-jade);background:color-mix(in srgb,var(--sa-jade) 8%,transparent)}\n#shushan-community-preview .sa-reset-toggle:focus-visible{outline:2px solid var(--sa-jade);outline-offset:3px}\n#shushan-community-preview .sa-reset-toggle:disabled{opacity:.4;cursor:wait}\n#shushan-community-preview .sa-promotion{margin-top:24px;padding-top:22px;border-top:1px solid var(--sa-line)}\n#shushan-community-preview .sa-promotion-row{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:18px 0;border-bottom:1px solid var(--sa-line)}\n#shushan-community-preview .sa-promotion-row h4{color:var(--sa-jade);font-size:20px}\n#shushan-community-preview .sa-promotion-row p{color:var(--sa-soft);margin:7px 0;overflow-wrap:anywhere}\n#shushan-community-preview .sa-promotion-row small{color:var(--sa-gold)}\n@container(max-width:460px){#shushan-community-preview .sa-head{flex-wrap:wrap}#shushan-community-preview .sa-brand{flex-basis:100%}#shushan-community-preview .sa-credit{margin-left:auto}#shushan-community-preview .sa-settings{padding:18px 16px}#shushan-community-preview .sa-promotion-row{align-items:flex-start;flex-direction:column}}\n#shushan-community-preview .sa-calendar-toolbar{display:flex;align-items:center;justify-content:space-between;gap:14px;margin:0 0 20px;flex-wrap:wrap}\n#shushan-community-preview .sa-calendar-month{display:flex;align-items:center;gap:20px;flex-wrap:wrap}\n#shushan-community-preview .sa-calendar-month h4{color:var(--sa-gold);font-size:20px;font-weight:400;margin:0;letter-spacing:1px}\n#shushan-community-preview .sa-calendar-week,#shushan-community-preview .sa-calendar-grid{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:1px}\n#shushan-community-preview .sa-calendar-week{color:var(--sa-soft);text-align:center;padding:10px 0;border-block:1px solid var(--sa-line)}\n#shushan-community-preview .sa-calendar-grid{background:var(--sa-line);border:1px solid var(--sa-line)}\n#shushan-community-preview .sa-calendar-day{min-width:0;min-height:97px;padding:9px 7px;background:var(--sa-raised);color:var(--sa-ink);border:0;display:flex;flex-direction:column;gap:7px;text-align:left;overflow:hidden;font-family:inherit;font-size:12px;transition:background .2s}\n#shushan-community-preview .sa-calendar-day:hover{background:color-mix(in srgb,var(--sa-jade) 13%,var(--sa-raised))}\n#shushan-community-preview .sa-calendar-day[aria-pressed=true]{background:color-mix(in srgb,var(--sa-jade) 17%,var(--sa-paper));box-shadow:inset 0 0 0 1px var(--sa-jade)}\n#shushan-community-preview .sa-other-month{opacity:.5}\n#shushan-community-preview .sa-day-number{display:flex;align-items:center;gap:6px;font-size:16px}\n#shushan-community-preview .sa-day-number small{font-size:10px;color:var(--sa-gold)}\n#shushan-community-preview .sa-is-today .sa-day-number{color:var(--sa-gold)}\n#shushan-community-preview .sa-day-events{display:flex;flex-direction:column;gap:3px;min-width:0;width:100%}\n#shushan-community-preview .sa-day-event{display:block;max-width:100%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:11px;padding-left:5px;border-left:2px solid var(--sa-jade);line-height:1.5;color:var(--sa-soft)}\n#shushan-community-preview .sa-day-event[data-kind=宗门]{border-color:var(--sa-gold);color:var(--sa-gold)}\n#shushan-community-preview .sa-day-event[data-kind=剑札],#shushan-community-preview .sa-day-event[data-kind=职事]{border-color:#b89888}\n#shushan-community-preview .sa-day-event[data-kind=机遇],#shushan-community-preview .sa-day-event[data-kind=记事],#shushan-community-preview .sa-day-event[data-kind=约定]{border-color:#b9a1c4}\n#shushan-community-preview .sa-more-events{font-size:10px;color:var(--sa-soft)}\n#shushan-community-preview .sa-day-dots{display:none}\n#shushan-community-preview .sa-calendar-legend{display:flex;flex-wrap:wrap;gap:9px 18px;margin:13px 0 23px;font-size:11px;color:var(--sa-soft)}\n#shushan-community-preview .sa-calendar-legend span:before{content:'';display:inline-block;width:5px;height:5px;background:var(--sa-gold);margin-right:6px}\n#shushan-community-preview .sa-calendar-legend span:nth-child(2):before{background:#b89888}\n#shushan-community-preview .sa-calendar-legend span:nth-child(3):before{background:var(--sa-jade)}\n#shushan-community-preview .sa-calendar-legend span:nth-child(4):before{background:#b9a1c4}\n#shushan-community-preview .sa-agenda-heading{margin:24px 0 15px;font-size:23px;color:var(--sa-ink);font-weight:400}\n#shushan-community-preview .sa-agenda-item{padding:19px 0;border-bottom:1px solid var(--sa-line)}\n#shushan-community-preview .sa-agenda-item h4,#shushan-community-preview .sa-calendar-add h4{font-size:20px;color:var(--sa-ink);font-weight:400;margin:8px 0}\n#shushan-community-preview .sa-agenda-item p{color:var(--sa-soft);line-height:1.9;margin:8px 0;overflow-wrap:anywhere}\n#shushan-community-preview .sa-calendar-add{padding:22px;background:var(--sa-raised);border-left:2px solid var(--sa-gold);margin:18px 0}\n#shushan-community-preview .sa-calendar-add select,#shushan-community-preview .sa-calendar-add input{min-width:0;max-width:100%;width:100%;box-sizing:border-box}\n#shushan-community-preview .sa-calendar-add select{padding:9px;color:var(--sa-ink);background:var(--sa-paper);font:inherit;border:1px solid var(--sa-line)}\n#shushan-community-preview .sa-department-jobs{margin:26px 0}\n#shushan-community-preview .sa-department-job{display:flex;align-items:center;justify-content:space-between;gap:15px;padding:16px 0;border-bottom:1px solid var(--sa-line)}\n#shushan-community-preview .sa-department-job>div{min-width:0}\n#shushan-community-preview .sa-department-job h5{font-size:18px;font-weight:400;color:var(--sa-ink);margin:0 0 6px}\n#shushan-community-preview .sa-department-job p{line-height:1.8;color:var(--sa-soft);margin:0}\n@container(max-width:620px){#shushan-community-preview .sa-calendar-day{min-height:67px;padding:8px 5px}#shushan-community-preview .sa-day-events{display:none}#shushan-community-preview .sa-day-dots{display:flex;gap:3px;flex-wrap:wrap}#shushan-community-preview .sa-day-dots i{width:4px;height:4px;background:var(--sa-jade)}#shushan-community-preview .sa-day-dots i[data-kind=宗门]{background:var(--sa-gold)}#shushan-community-preview .sa-day-dots i[data-kind=剑札],#shushan-community-preview .sa-day-dots i[data-kind=职事]{background:#b89888}#shushan-community-preview .sa-day-dots i[data-kind=机遇],#shushan-community-preview .sa-day-dots i[data-kind=记事]{background:#b9a1c4}#shushan-community-preview .sa-calendar-month{gap:10px}#shushan-community-preview .sa-calendar-month h4{font-size:17px}#shushan-community-preview .sa-calendar-add{padding:17px}#shushan-community-preview .sa-department-job{align-items:flex-start;flex-direction:column}#shushan-community-preview .sa-content:has(.sa-calendar-grid) .sa-page-head{flex-direction:column;align-items:flex-start;gap:12px}#shushan-community-preview .sa-content:has(.sa-calendar-grid) .sa-living-date{align-items:flex-start}}\n@container(max-width:460px){#shushan-community-preview .sa-content:has(.sa-calendar-grid){padding-inline:5px}#shushan-community-preview .sa-content:has(.sa-calendar-grid) .sa-page-head{padding-inline:10px}#shushan-community-preview .sa-calendar-day{min-height:59px}#shushan-community-preview .sa-day-number{font-size:14px}#shushan-community-preview .sa-calendar-toolbar{padding-inline:8px}#shushan-community-preview .sa-calendar-legend{padding-inline:8px}#shushan-community-preview .sa-agenda-item{padding-inline:10px}#shushan-community-preview .sa-agenda-heading{padding-inline:10px}}\n",[{"id":"poetry","value":{"名称":"望云诗社","社印":"诗","主题":"吟诗 · 闲谈","诗句":"借半山云色，换几句闲诗。","简介":"喜爱赏景吟诗的同门，自发相聚，饮茶听风，彼此续句。","场所":"剑峰边缘","联系人":[],"活动":{}}},{"id":"sword","value":{"名称":"拂晓论剑社","社印":"剑","主题":"对练 · 论剑","诗句":"朝露未晞，先借一剑问同袍。","简介":"以晨起交流切磋为乐，点到为止，互相印证。","场所":"演武场","联系人":[],"活动":{}}},{"id":"pill","value":{"名称":"丹炉闲话会","社印":"丹","主题":"丹道 · 交流","诗句":"一炉火候慢，半席闲话长。","简介":"丹鼎阁同门在候火间隙交流草木与丹道心得。","场所":"丹鼎阁","联系人":[],"活动":{}}},{"id":"wine","value":{"名称":"青石坊酒友会","社印":"酌","主题":"饮酒 · 见闻","诗句":"山下灯初上，同袍共一壶。","简介":"得闲下山打酒，与同门分享路途见闻。","场所":"青石酒馆","联系人":[],"活动":{}}},{"id":"care","value":{"名称":"养剑同好会","社印":"养","主题":"养剑 · 交流","诗句":"拂去锋上尘，方知岁月温。","简介":"交流本命飞剑的温养与养护，不擅动他人佩剑。","场所":"聚会场所待同门商议","联系人":[],"活动":{}}},{"id":"tower","value":{"名称":"锁妖塔听风会","社印":"听","主题":"观礼 · 传闻","诗句":"塔外听长风，灯前辨旧闻。","简介":"只在规定外围区域观礼听风，不进入封镇禁区，猜测不视为事实。","场所":"锁妖塔外围规定区域","联系人":[],"活动":{}}}],{"base":"# 蜀山弟子令联动\n\n仅在主角已正式加入蜀山时启用。原六栏顺序不变，另有岁序、职事、掌峰；内门解锁职事，炼虚或长老解锁掌峰。\n\n## 边界与更新\n\n- 权威身份为原卡 `主角.宗门`。未入门无界面、无专用数据、无提示或场景。玩家明确拜入才演绎入门，已有蜀山出身承接背景。\n- 新数据仅在根级 `stat_data.蜀山剑门`。不得给原主角、人物、机遇等嵌套结构增添字段；不接触器灵台词。功德唯一余额沿用 `主角.宗门贡献` 非负整数。\n- 服从运行时“蜀山更新通道”指令。正文或原额外解析均沿用同一 UpdateVariable/JSONPatch；在 Analysis 内标明指定通道。独立API模式下正文和原额外解析不写蜀山字段。原卡自己的更新照常，禁止第二套MVU。不要输出前端HTML或技术说明。\n- 只更新已发生的变化；逐字段补写，不能重建集合、清空进行中任务或改写下划线凭据。首次登记只补少量适合身份的课业、闻讯、可接剑札和目录；不会因导入自动获得物品、社团或已接任务。\n\n## 数据结构\n\n```text\n蜀山剑门:\n  名籍: {峰脉, 身份, 师承, 居所, 入门时间, 入门方式, 简介, 宗主真传身份, 长老考绩确认, 宗主指定继任, 宗主无法执掌, 真传不足接任, 自立峰}\n  剑札: {编号: {名称, 目标, 说明, 地点, 时限, 奖励贡献, 状态, 进度}}\n  追踪剑札: 编号\n  课业: {编号: {名称, 时辰, 性质, 地点, 条件, 说明}}\n  闻讯: {编号: {类别, 标题, 摘要, 详情, 来源, 性质, 时间, 关联雅集}}\n  雅集: {编号: {名称, 社印, 主题, 诗句, 简介, 场所, 联系人: [姓名], 活动: {标题, 时间, 说明}}}\n  我的雅集: [雅集编号]\n  目录: {编号: {名称, 分类, 方式, 品阶, 描述, 单价, 单位, 最低身份, 库存, 层级, 需特许, 已获特许}}\n  借阅: {办理编号: {名称, 层级, 天数, 起借时间, 应还时间, 状态, 费用}}\n  办理: {办理编号: {编号, 状态, 申请时间, _凭证, 说明, 结果}}\n  岁序: {基准年, 首次记录时间, 最近核对时间}\n  日程: {编号: {标题, 类别, 说明, 状态, 开始, 结束, 全天, 周期, 每月日, 星期, 时辰, 起始日期, 终止日期, 来源类型, 来源编号, 重要}}\n  日程标记: {当次编号: {状态, 标题, 类别, start, end, 来源编号, 记录时间}}\n  活动记录: {活动编号: {名称, 开始, 结束, 状态, 报名, 确认参加, 优胜确认, 结果}}\n  任职: {部门, 职务, 状态, 任职时间}\n  政务申请: {编号: {状态, 申请时间, _凭据, 结果}}\n  峰脉名录: {编号: {名称, 传承方向, 选址, 峰主, 状态, 宗门认可, 成立时间, 弟子, 设施, 招生}}\n```\n\n名籍峰脉仅为已确认六峰或已立峰名录中的新峰，未知留空；居所、师承、部门分别存放。宗主真传与长老以上宗门直属，自立峰另记。正文只知当前位置或某物来自某峰，不能推断归属。地品入内门，优秀获认可可峰主真传；天品宗主真传直属宗主，不归六峰。\n\n## 剑札与审批\n\n剑札：待接取→进行中→待结算→已完成；失败、放弃、失效须实际依据。名称目标明确，奖励贡献为非负整数。界面接取立即存状态和只读接取时间；正文接取写`剧情接取时间`。已接任务持续保留，不套原机遇结束即删规则。\n\n确认完成只设待结算并补进度，不直接增加同笔贡献；脚本统一结算一次。晋升/开峰另补批准人、完成依据及相应确认字段。办理申请也只由AI核准、脚本扣费与入库，具体协议按需提供，不走两套发奖。\n\n## 日常与日程\n\n生活沿用宿舍、雅集和日常互动设定，当前闻讯约三至五条即可；日期、地点或剧情变化后更新相关条目，打开界面不随机换消息。传闻、邀约、告示分清来源，消息不等于事实或玩家已经参与。凡人、普通弟子和长老均有自己的作息，不凭空公开内心、私事或禁区机密。\n\n已有雅集最多加入两个；加入/退出需真实交往或已完成申请。初五、十五、廿五固定会日保留，允许新社团与临时邀约，不统一增加全部人物好感。具体课程、外勤、机遇和约定有日期就记日程，未知留待排期；机遇日期只存扩展。手动勾销只收起当次提醒，不代替交接和发奖。\n\n界面行动使用自然叙述。后台摘要另有准确编号与路径，核对后再更新；不得在人物台词、旁白或玩家行动中泄露字段和长编号。活动报名不等于到场，任职申请不等于批准；部门职事与师门剑札共用任务编号。详细成长、岁序、职事、开峰和办理规则按需注入。\n","growth":"# 晋升与承继\n\n境界沿用原卡炼气、筑基、金丹、元婴、化神、炼虚、合体、大乘、渡劫。身份、师承、职务分别判断，天资身份不直接提高修为。名籍“晋升”可查看要求并领取任务；不设定期内门考核或峰主真传遴选。\n\n| 路线 | 条件与任务 | 完成确认 |\n| --- | --- | --- |\n| 杂役→外门 | 筑基即由脚本登记，不用任务 | 不再发杂役晋升考察 |\n| 外门→内门 | 元婴起，完成一项适合境界和地点的外勤，回报任务堂并获内务堂核准 | 外勤完成=true |\n| 普通内门→峰主真传 | 化神起，峰脉已确认；完成所属峰主亲授任务，取得亲自收徒许可 | 峰主任务完成=true、峰主许可=true |\n| 内门或真传→长老 | 合体起，完成宗门职事任务，宗主正式任命并交接 | 职事任务完成=true、宗主任命=true |\n| 长老→大长老 | 合体起，完成统筹宗门的职事任务，长老议事认可并获宗主任命 | 职事任务完成=true、长老议事认可=true、宗主任命=true |\n\n接取后根据当前剧情细化具体委托：外勤可护送、巡勘或查证；峰主任务体现本峰剑道与对弟子的判断；长老任务考察护山、教习或协调能力，大长老任务考察跨司统筹。给出明确目标、地点、风险、交接人与完成依据，不空写“做一个任务”，不固定只有同一题，不强迫额外比武。不能因点击就认定已经办妥。\n\n共用确认：对应晋升剑札写状态=待结算、晋升确认=true、批准人、完成依据，再补上表标志；脚本一次办理身份，不另行重复改变同笔主角身份、贡献或结算标记。脚本下划线字段不可修改。峰主真传不自动继任峰主，长老以上宗门直属，自立峰另记。旧特许考核字段不能代替新任务完成。\n\n新生大比仍保留破格入内门：实际活动记录确认参加=true、优胜确认=true后发布破格剑札，不受普通元婴门槛；完成内务堂确认再落籍，不把全部参赛者晋升。\n\n## 宗主承继\n\n宗主真传达到大乘即可办理承继，免额外试炼或贡献门槛。常规序列只含已取得该身份的玩家与苏清雪，按剧情确定承继人与授印交接；不能凭空新增竞争亲传。宗主真传转任长老时保留名籍.宗主真传身份=true。\n\n非真传大乘大长老仅在宗主明确指定（名籍.宗主指定继任=true），或宗主无法执掌且真传不足接任（两项均有实际剧情并设true）时，进入特殊承继。由宗门认可、安排实际交接，不仅靠升到大乘自动夺位。\n\n两种承继均需对应剑札晋升确认、批准人、完成依据与交接确认=true；无需额外打败在位宗主。现任仍正常执掌时先依剧情商议让位和授印，避免同时出现两位在位宗主。炼虚开峰与合体长老资位分别处理。\n","calendar":"# 宗门岁序与修行日历\n\n唯一时钟为原卡世界.当前时间，兼容带间隔点的年月日；脚本计算自然月、闰年、跨年和循环，不用现实钟或自动推进剧情。区间含开始、不含结束，各事项有独立首届，不随安装日期重置。\n\n| 事项 | 首届或年度会期 | 周期 |\n| --- | --- | --- |\n| 3727届招生季 | 3726年12月1日—3727年3月1日 | 十年一次，三个月 |\n| 新生大比 | 3727年9月1日—10月1日 | 当届统一收生结束后六个月，持续一月；下届3737年9月1日 |\n| 论剑大会 | 3730年6月1日—8月1日 | 十年一次，两个月；下届3740年 |\n| 春山巡护 | 每年4月5日—4月8日 | 3727年起，每年三日 |\n| 望月灯会 | 每年8月15日—8月18日 | 3727年起，每年三日 |\n| 归藏晒经 | 每年11月1日—11月4日 | 3727年起，每年三日 |\n| 锁妖塔封镇祭 | 每年12月15日—12月29日 | 整备、冬至封镇与复核 |\n| 金符甲子大修 | 3787年12月1日—3788年1月1日 | 每六十年一次 |\n\n新生大比是全宗统一会期，不按个人入门日加半年，也不要求先有个人入门日期才显示。参赛资格由当届名籍、身份和实际剧情核准；出生于蜀山或老弟子开局不重新招生、不自动归入本届新生。保留实战初试、复赛、决选、破格复核，无笔试；外门优胜可走破格任务。\n\n论剑经分组、预选、跨峰竞逐至剑子决选，十大剑子选剑、前三赐诀依实际赛果。内门及峰主真传晋升比试已取消，改在名籍领取任务。报名通常提前三十日，报名不等于到场、获奖或晋升。\n\n春巡以春汛山道、灵苗照护和结伴识路为主；灯会可赏月续诗、做灯饮茶，由雅集自然参与；晒经为外院校卷、养剑交流，受限典籍不公开。这三项不强制比武、交费、加好感或获得宝物，可依实际职责领短差。封镇权限遵守原设。\n\n日历汇总已接剑札、职事、课业、已加入雅集会日、机遇和手记。未知日期待排期。日程字段为标题、类别、说明、状态、开始、结束、全天、周期、每月日、星期、时辰、起始日期、终止日期、来源类型、来源编号、重要；周期可一次、每日、每月、每周。原机遇日期放扩展日程，以来源类型=机遇、来源编号关联，不改原ZOD机遇对象。\n\n课程日期依实际安排；外门固定晨课按每日。加入雅集后才生成初五、十五、廿五会日，可按会日、会时调整。长老开坛与临时活动在正式确认后记录岁序.临时活动，不能编造固定周期。\n\n完成事项退出当前提醒。勾销本次或收起仅改当次日程标记，不改真实任务、贡献或身份；重复会期保留，已勾销可恢复。过期未完任务留待回报，不自动失败、补赛或受罚。分支回退读取当前数据，首次安装不补办往届。所有编号、路径和字段只留后台，不出现在正文台词。\n","department":"# 百司职事\n\n转入另一部门时先完成既有职务交接，在申请结果中写 `交接完成=true`，再由脚本变更主要任职。未交接时仍保留原任职。\n\n正式内门、峰主真传、宗主真传及以上可申请加入现有部门，实际任务还受修为与职务限制。部门与六峰、师承、雅集分开；当前只登记一份主要任职，可协助其他部门。\n\n任务堂：外勤、文书、情报核验。内务堂：名籍、晋升登记、功德核对。执法堂：巡查、取证、护山执勤。勤务殿：灵田、仓储、膳食、采购。功德堂：物资验收、兑换。教务堂：课业、新生指导。藏经阁：典籍、借阅核对。执事堂：跨部门协调。丹鼎阁：炉料、丹道。符阵阁：符箓、阵基维护。沿用既有堂阁殿，不凭空替换原负责人。\n\n界面申请保存在 `政务申请[id]`，`_凭据` 不得修改。剧情批准后只将 `状态=已批准`、`结果.职务=协办/执事/主事`；脚本登记到 `任职`。化神以下仅任协办，不能因亲传身份就获得高层实权职务。转任须在剧情核对旧职交接，离任同样需批准。不收费，不重复登记或凭空升堂主。\n\n每月可有一份适合实际修为的部门职事剑札；已有待接/进行中职事不重复堆积。AI可细化目标并另补实际任务，不因任务模板存在就假定已经领料、执行或完成。任务贡献统一由原剑札结算，不另发部门货币。\n\n任职登记后，前端的本司待办直接展示对应部门工作，与师门剑札使用同一编号、同一进度。领取后有明确日期则入月历，尚无日期则入待排期；AI在真实安排后补齐地点、日期与细节，不为填日历强行编造期限。化神以下协办以整理、记录、辅助为主，不单独执掌丹炉或护山核心。\n","peak":"# 掌峰与高阶治理\n\n炼虚起可申请自立峰；长老、大长老、宗主解锁高阶管理。开峰资格、峰主职责、长老资位分开，不因达到炼虚便自动晋为合体长老。\n\n玩家提交峰名、传承方向、拟议选址后，脚本发布开峰剑札。经宗主许可、灵脉考察、资源筹备、护峰阵法、传承规划与立峰仪式，AI根据实际剧情推进。现有六峰与主峰不能被重名覆盖，不凭空增加资源、灵石或现成弟子。\n\n完成后在开峰剑札补 `状态=待结算`、`批准人`、`完成依据`，以及 `开峰确认=true`、`宗主许可=true`、`灵脉落实=true`、`资源落实=true`、`护峰阵法完成=true`。不改 `_开峰方案`，不同时另行登记同一座峰；脚本结算后写入 `峰脉名录[id]`，并在名籍记录 `自立峰=id`。\n\n新峰字段包括名称、峰主、传承方向、选址、状态、宗门认可、成立时间、设施、弟子和招生；采用稳定编号动态扩充，不写死地图。长老仍归宗门直属，自立峰是其掌管的组织，不是把他重编为六峰弟子。\n\n招生需玩家实际发起并获宗门允许，按实际接引与拜师登记 `峰脉名录[id].弟子`，每名含姓名、境界、身份、师承、入峰时间。`招生` 可记录状态、标准、日期。`设施`记录实际建设，资源投入按主卡既有余额与物品处理，不出现免费的挂机收益。峰务、授业、巡视、求见宗主与议事操作先拟写行动，由玩家发送后演绎。\n\n宗主真传保留常规继承资格；大乘大长老的特殊继任遵守成长规则，不以开峰成就自动取代白薇或苏清雪。\n","trade":"# 功德与办理规则\n\n## 功德传承：藏经阁与功德堂\n\n目录由宗门资源、身份、境界与当前剧情共同决定，不是无限商城。报价一旦告知便保持稳定，改变价格或库存需有原因。`单价`、`库存` 为纯数字；未确认报价时省略单价，前端会先问询。不得凭空编成一张适用于所有品阶的统一价格表。\n\n- `分类` 可为功法、器物、丹药、材料、符箓或其他。所有法器、法宝等非消耗装备统一按器物分类，具体等级另记在结果的 `等级`，不得放进储物袋。丹药、材料、消耗品存储物袋。\n- `方式` 必须为借阅、传承或兑换。藏经阁显示借阅与传承，功德堂显示兑换，分类可继续增加。\n- 外门功法：`层级=外门`，10 功德/日，最多七日，最低外门弟子；内门功法：`层级=内门`，100 功德/日，最多三日，最低内门弟子。\n- 地阶以上：`层级=地阶以上`，5000—50000 功德/次，真传或长老特许，阅后即还且不可抄录。特许须由剧情实际取得，才能设置 `已获特许=true`。\n- 借阅仅获得限期阅览资格，不表示永久拥有或已经学会；登记剧情历法的应还时间。阅览所得的学习进展由实际修行决定，不因翻开前端剑谱就增加功法。\n- 传承依课程、功德学习资格、导师与试炼展开；只有实际习得且获准时才能给出传承结果。不传之秘受真传及特殊条件限制。\n- 兑换明确价格、数量、身份限制与实际可供资源，遵守原卡器物品阶、使用门槛与物品结构；不得为凑目录而无条件售卖顶级资源。\n\n## 界面办理确认与一次性结算\n\n界面申请保存在 `办理[编号]`，其 `_凭证` 由脚本写入，包含冻结的报价、数量、天数和对象。AI不得重建或改写凭证，不得替换整条办理记录来清掉它。\n\n1. 结合玩家请求演绎问询、排队、登记、审核或交易。未办妥保持待确认；被拒时写已拒绝并说明理由。玩家明确撤销后不再批准。\n2. 剧情已经办妥时，仅更新该办理条目的 `状态=已批准`、`说明`、`结果`。不得同时直接扣除该笔贡献、发放该笔物品、修改该笔雅集归属，脚本负责一次性保存这些结果。\n3. 结果字段：\n   - 器物：`{名称, 等级, 类型, 状态, 描述}`，描述不少于三十字，等级及使用状态遵守原卡；损耗由新得时脚本记为零。\n   - 丹药、材料、符箓等：`{名称, 描述}`，数量采用已申请数量，不重复叠加。器物禁止伪装成材料。\n   - 借阅：`{应还时间}`，使用当前剧情历法算出完整应还时间；不写入功法栏。\n   - 传承：`{名称, 已习得:true, 类型, 境界, 描述}`，类型包含功法品阶与方向，描述不少于三十字；只有真正完成传授时批准，脚本登记熟练度零，不凭空给予熟练度。\n   - 入社、退社、建社、归还：核对条件与剧情，结果可为空对象，实际归属和借阅状态由脚本更新。\n4. 脚本核对当前余额、库存、身份、凭据及重复办理情况；成功后同次保存扣款、主卡所得、办理已完成记录。已完成不得再次批准或另行追加物品。脚本提示暂缓时只补充缺失结果或澄清条件，不靠重写凭据绕过。\n5. 不属于界面申请的自然剧情交易与收获仍沿用主卡规则；同一笔行为必须选择一种结算途径，不能重复到账。\n\n更新路径示例：向 `/蜀山剑门/目录/稳定编号` 插入目录对象；批准时对 `/蜀山剑门/办理/实际编号/状态` replace 为 `已批准`，对同编号 `/结果` 写入结果。使用原卡的前导斜线规则，不在 path 加 `stat_data` 前缀。未发生相关事项时说明无变化即可，不强制每轮编造交易。\n"});
})().catch(error=>{console.error("[蜀山剑门]",error);try{(window.parent||window).__shushan_health={phase:"error",member:false,detail:error.message||String(error)};}catch{}});
