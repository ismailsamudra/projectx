const {Expert,randomId} = require('expert-json');
const bcrypt = require('bcrypt');
const moment = require('moment');
const jwt = require('jsonwebtoken');

const Authenticate = async (req,res)=>{
    const act = req.params.act;
    const db = new Expert("./db/admin.json");
    if(act=="login"){
        const username = req.body.username;
        const user = await db.find({username});
        if(user.length>0){
            try {
                const match = await bcrypt.compare(req.body.password,user[0].password);
                if(!match)return res.status(200).json({errorMsg:"password Salah"});
                const accessToken = jwt.sign({id:user[0].id,username,name:user[0].name},process.env.ACCESS_SECRET_TOKEN,{
                    expiresIn:"20s"
                });
                const refreshToken = jwt.sign({id:user[0].id,username,name:user[0].name},process.env.REFRESH_SECRET_TOKEN,{
                    expiresIn:process.env.SESSION_EXPIRE
                });
                const updatedAt = moment().format("DD-MM-YYYY HH:mm");
                await db.update({username},{refreshToken,updatedAt});
                res.cookie("refreshToken",refreshToken,{
                    httpOnly: true,
                    maxAge: 24 * 60 * 60 * 1000
                })
                res.cookie("consId",user[0].id,{
                    httpOnly: true,
                    maxAge: 24 * 60 * 60 * 1000
                })
                return res.status(200).json({success:true,accessToken});
            } catch (e) {
                return res.status(200).json({errorMsg : "PRECONDITION_FAILED",log:e});
            }
        }else{
            return res.status(200).json({errorMsg:"user tidak di temukan"});
        }
    }else if(act=="register"){
        if(!req.body.name || !req.body.username || !req.body.password || !req.body.cPassword){
            return res.status(200).json({
                errorMsg : "PRECONDITION_FAILED"
            });
        }
        if(req.body.password !== req.body.cPassword){
            return res.status(200).json({
                errorMsg : "password dan confirm password tidak sama."
            });
        }
        const salt = await bcrypt.genSalt();
        const hasPassword = await bcrypt.hash(req.body.password,salt)
        req.body.password = hasPassword;
        req.body.refreshToken = null;
        req.body.createdAt = moment().format("DD-MM-YYYY HH:mm");
        req.body.id = randomId("Aan",8);
        req.body.dataHock = 1;
        req.body.hp = null;
        await db.insert(req.body);
        return res.status(200).json({
            id:req.body.id,
            msg : "Register Berhasil."
        });
    }else if(act=="logout"){
        const id = await req.cookies.consId;
        await db.update({id},{refreshToken:null});
        res.clearCookie("refreshToken");
        res.clearCookie("consId");
        return res.status(200).json({success:true});
    }else if(act=="password"){
        if(!req.body.oldPassword || !req.body.newPassword || !req.body.cPassword){
            return res.status(200).json({errorMsg : "PRECONDITION_FAILED"});
        }
        if(req.body.newPassword !== req.body.cPassword){
            return res.status(200).json({
                errorMsg : "New Password & confirm password tidak sama."
            });
        }
        const refreshToken = await req.cookies.refreshToken;
        if(refreshToken){
            jwt.verify(refreshToken,process.env.REFRESH_SECRET_TOKEN,async(err,decode)=>{
                if(err){return res.status(200).json({errorMsg : "UNAUTHORIZED"});}
                const id = decode.id;
                const o = await db.findOne({id});
                const match = await bcrypt.compare(req.body.oldPassword,o.password);
                if(!match)return res.status(200).json({errorMsg:"Password Lama Salah"});
                const salt = await bcrypt.genSalt();
                const password = await bcrypt.hash(req.body.newPassword,salt)
                await db.update({id},{password});
                return res.status(200).json({success : true});
            });
        }else{
            return res.status(200).json({errorMsg : "UNAUTHORIZED"});
        }
        
    }else{
        return res.status(200).json({errorMsg:"Fungsi Tidak tersedia."});
    }
}

module.exports = Authenticate;