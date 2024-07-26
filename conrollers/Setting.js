const {Expert,randomId} = require('expert-json');
const bcrypt = require('bcrypt');
const moment = require('moment');
const jwt = require('jsonwebtoken');

const Setting = async (req,res)=>{
    const act = req.params.act;
    const db = new Expert("./db/inc.json");
    if(act=="updateinc"){
        const id = req.body.id;
        const val = req.body.val;
        const col = req.body.col;
        if(!id || !val || !col){return res.status(200).json({errorMsg:"PRECONDITION_FAILED"});}
        await db.update({id:col},{[id]:val});
        return res.status(200).json({success:true});
    }else if(act=="uploadimg"){
        const id = req.body.id;
        const val = req.file;
        const col = req.body.col;
        if(!id || !val || !col){return res.status(200).json({errorMsg:"PRECONDITION_FAILED"});}
        await db.update({id:col},{[id]:val});
        return res.status(200).json({success:true});
    }else{
        return res.status(200).json({errorMsg:"Fungsi Tidak tersedia."});
    }
}

module.exports = Setting;