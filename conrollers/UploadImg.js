const {Expert} = require('expert-json');
const excelToJson = require('convert-excel-to-json');
const moment = require('moment');
const fs = require('fs');

const imgToInc = async (req,res)=>{
    const db = new Expert("./db/inc.json");
    const id = req.body.id;
    const val = req.file;
    const col = req.body.col;
    if(!id || !val || !col){return res.status(200).json({errorMsg:"PRECONDITION_FAILED"});}
    const o = await db.findOne({id:col});
    const root = "./assets"+o[id];
    if (fs.existsSync(root)){
        console.log(root);
        fs.unlinkSync(root);
    }
    await db.update({id:col},{[id]:"/img/"+val.filename});
    await db.update({id:col},{[id+'_info']:val});
    return res.status(200).json("/img/"+val.filename);
}
const excBroadcast = async (req,res)=>{
    const val = req.file;
    const root = "./assets/img/"+val.filename;
    const result = excelToJson({
        sourceFile: root
    });
    const db = new Expert("./db/broadcast.json");
    for(var i = 0;i<result.Sheet1.length;i++){
        let body = {};
        body.nama = result.Sheet1[i].A;
        body.hp = filterNo(result.Sheet1[i].B);
        body.dataHock = 1;
        body.status = "true";
        body.id = moment().format("YYYYMMDDHmmss_"+i);
        body.createdAt = moment().format("DD-MM-YYYY HH:mm");
        const cek = await db.find({hp:body.hp});
        if(cek.length<1){
            await db.insert(body);
        }
    }
    if (fs.existsSync(root)){
        fs.unlinkSync(root);
    }
    return res.status(200).json({success:true});
}
function filterNo(number) {
    let formatted = number.toString().replace(/\D/g, '');
    if (formatted.startsWith('8')) {
       formatted = '0' + formatted;
    }
    if (formatted.startsWith('62')) {
       formatted = '0' + formatted.substr(2);
    }
    if (formatted.startsWith('+62')) {
       formatted = '0' + formatted.substr(3);
    }
    return formatted;
}
module.exports = {imgToInc,excBroadcast};