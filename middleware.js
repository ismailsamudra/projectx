const jwt = require('jsonwebtoken');
const {Expert} = require('expert-json');

const replyData = async(req,res,next)=>{
    const inc = new Expert("./db/reply.json");
    req.reply = await inc.findOne({"class":0});
    return next();
}
const aiData = async(req,res,next)=>{
    const ai = new Expert("./db/ai.json");
    const show = await ai.findOne({"id":"doc"});
    req.ai = show.doc;
    return next();
}
const tempData = async(req,res,next)=>{
    const temp = new Expert("./db/template.json");
    req.template = await temp.get();
    return next();
}
const mData = async(req,res,next)=>{
    const inc = new Expert("./db/inc.json");
    req.inc = await inc.findOne({"id":"dataApp"});
    return next();
}
const App = async(req,res,next)=>{
    const db = new Expert("./db/admin.json");
    const refreshToken = await req.cookies.refreshToken;
    const id = await req.cookies.consId;
    if(!refreshToken || !id){
        res.clearCookie("refreshToken")
        res.clearCookie("consId")
        res.redirect('/login');
        return;
    }
    const o = await db.findOne({id});
    if(refreshToken == o.refreshToken){
        jwt.verify(refreshToken,process.env.REFRESH_SECRET_TOKEN,(err,decode)=>{
            if(err){
                res.clearCookie("refreshToken")
                res.clearCookie("consId")
                res.redirect('/login');
                return;
            }
           req.me=o;
           return next();
        });
    }else{
        res.clearCookie("refreshToken")
        res.clearCookie("consId")
        res.redirect('/login');
        return;
    }
}
const Auth = async(req,res,next)=>{
    const db = new Expert("./db/admin.json");
    const refreshToken = await req.cookies.refreshToken;
    const id = await req.cookies.consId;
    if(!refreshToken || !id){
        res.clearCookie("refreshToken")
        res.clearCookie("consId")
        res.redirect('/info/Session_Logout');
        return;
    }
    const o = await db.findOne({id});
    if(refreshToken == o.refreshToken){
        jwt.verify(refreshToken,process.env.REFRESH_SECRET_TOKEN,(err,decode)=>{
            if(err){
                res.clearCookie("refreshToken")
                res.clearCookie("consId")
                res.redirect('/info/Session_Logout');
                return;
            }
           req.me=o;
           return next();
        });
    }else{
        res.clearCookie("refreshToken")
        res.clearCookie("consId")
        res.redirect('/info/Session_Logout');
        return;
    }
}
const Guest = async(req,res,next)=>{
    const refreshToken = await req.cookies.refreshToken;
    const consId = await req.cookies.consId;
    if(refreshToken || consId){
        jwt.verify(refreshToken,process.env.REFRESH_SECRET_TOKEN,(err,decode)=>{
            if(!err){res.redirect('/app');return;}
            next();
        });
    }else{
        next();
    }
}
const Api = async(req,res,next)=>{
    const db = new Expert("./db/admin.json");
    if(req.params.act=='login'){return next();}
    const refreshToken = await req.cookies.refreshToken;
    const id = await req.cookies.consId;
    if(!refreshToken || !id){
        res.clearCookie("refreshToken")
        res.clearCookie("consId")
        return res.status(200).json({errorMsg:"UNAUTHORIZED"});
    }
    const o = await db.findOne({id});
    if(refreshToken == o.refreshToken){
        jwt.verify(refreshToken,process.env.REFRESH_SECRET_TOKEN,(err,decode)=>{
            if(err){
                res.clearCookie("refreshToken")
                res.clearCookie("consId")
                return res.status(200).json({errorMsg:"UNAUTHORIZED"});
            }
           return next();
        });
    }else{
        res.clearCookie("refreshToken")
        res.clearCookie("consId")
        return res.status(200).json({errorMsg:"UNAUTHORIZED"});
    }
}
module.exports = {mData,App,Auth,Guest,Api,replyData,aiData,tempData};