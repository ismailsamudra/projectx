const { Client , LocalAuth , MessageMedia } = require('whatsapp-web.js');
const { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } = require('@google/generative-ai')
// const qrCmd = require('qrcode-terminal')
const {Expert} = require('expert-json');
const moment = require('moment');
let status = "NOT READY";
let clientName = null;
let clientNumber = null;
let qrcode = null;
const client = new Client({
    webVersionCache: {
    type: "remote",
    remotePath:
        "https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html",
    },
    authStrategy: new LocalAuth(),
    restartOnAuthFail: true,
    puppeteer: { 
        headless: true,
        args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--single-process', // <- this one doesn't works in Windows
        '--disable-gpu',
        // '--disable-extensions'
        ]
    }
});
try {
    client.initialize();
} catch (e) {}

//--------------------------------------------- START
client.once('ready', () => {
    status = "READY";
    const inc = (client.info)?client.info:false;
    if(inc){
        clientNumber = inc.wid.user;
        clientName = inc.pushname;
    }
    console.log('Client is ready!');
});
//--------------------------------------------- END
//--------------------------------------------- START
client.on('qr', (qr) => {
    qrcode = qr;
    // console.log('QRCODE ON : ');
    // qrCmd.generate(qr, {small: true});
});
//--------------------------------------------- END
//--------------------------------------------- START
client.on('authenticated', () => {
console.log('WhatsApp Web On : AUTHENTICATED');
});
//--------------------------------------------- END
//--------------------------------------------- START
client.on('auth_failure', msg => {
console.error('AUTHENTICATION FAILURE', msg);
client.initialize();
status = "NOT READY";
clientNumber = null;
clientName = null;
console.log('WhatsApp Web On : '+status);
});
//--------------------------------------------- END
//--------------------------------------------- START
client.on('change_state', state => {
console.log('WhatsApp Web On : CHANGE STATE', state );
});
//--------------------------------------------- END
//--------------------------------------------- START
client.on('disconnected', (reason) => {
console.log('Client was logged out', reason);
client.initialize();
console.log('WhatsApp Web On : '+status);
});
//--------------------------------------------- END
//--------------------------- INISIASI GOOGLE-AI START
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);
const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash", // or gemini-1.5-pro
    safetySettings: [
        {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        },
    ],
});
const chat = model.startChat({
    history:[],
    generationConfig: {
        maxOutputTokens:5000
    }
});
setTimeout(async() => {
    try {
        const ms = new Expert("./db/ai.json");
        const AI = await ms.findOne({id:'doc'});
       chat.sendMessageStream(AI.auto.replaceAll('\n',','));
       chat.sendMessageStream(AI.doc.replaceAll('\n',','));
    } catch (e) {}
}, 100);
//----------------------------- INISIASI GOOGLE-AI END
//--------------------------------------------- START
client.on('message', async message  => {
    const db = new Expert("./db/reply.json");
    const inc = new Expert("./db/inc.json");
    let msg = message.body;
    const INC = await inc.findOne({id:'dataApp'});
    if(INC.opsiReply=='MANUAL'){
        const cek = await db.find({text:msg});
        if(cek.length>0){
            const o = await db.findOne({text:msg});
            if(o.resp &&  o.status=='true'){
                if(o.file && o.ext){
                    const caption = o.resp;
                    const base64 = o.file;
                    const mimetype = (o.ext=='pdf')?'application/'+o.ext:'image/'+o.ext;
                    const media = new MessageMedia(mimetype, base64, 'Media');
                    client.sendMessage(message.from, media, {
                        caption: caption
                    });
                }else{
                    message.reply(o.resp);
                }
            }
        }else{
            const x = await db.findOne({class:0});
            if(x.resp && x.status=='true'){
                if(x.file && x.ext){
                    const caption = x.resp;
                    const base64 = x.file;
                    const mimetype = (x.ext=='pdf')?'application/'+x.ext:'image/'+x.ext;
                    const media = new MessageMedia(mimetype, base64, 'Media');
                    client.sendMessage(message.from, media, {
                        caption: caption
                    });
                }else{
                    message.reply(x.resp);
                }
            }
        }
    }else if(INC.opsiReply=='GOOGLE-AI'){
        try {
            const prompt = msg;
            const result = await chat.sendMessageStream(prompt);
            let buffer="";
            for await (let response of result.stream) {
                buffer += response.text()
            }
            message.reply(buffer);
        } catch (e) {
            console.log(e);
        }
    }else{}
});
//--------------------------------------------- END
//============================================= STAR
async function send(num,text){
    try {
        const number = filterNo(num);
        const message = text;
        const isRegisteredNumber = await client.isRegisteredUser(number);
        if(isRegisteredNumber){
         //==== KIRIM PESAN
           await client.sendMessage(number, message)
           return 'SEND_SUCCESS';
        }else{
           return 'NO.HP BELUM TERDAFTAR WhatsApp';
        }
    } catch (e) {return 'SEND_FAILED';}
}
//============================================= END
//============================================= STAR
async function send_base64(n,caption,base64,mime){
    try {
        const number = filterNo(n);
        //==== CEK NO WA
        const isRegisteredNumber = await client.isRegisteredUser(number);
        if(isRegisteredNumber){
            //==== KIRIM PESAN
            const media = new MessageMedia(mime, base64, 'Media');
            await client.sendMessage(number, media, {caption: caption})
            return 'SEND_SUCCESS';
        }else{
            return 'NO.HP BELUM TERDAFTAR WhatsApp';
        }
    } catch (e) {return 'SEND_FAILED';}
}
//============================================= END
const WhatsApp = async (req,res)=>{
    const act = req.params.act;
    if(act=="qr"){
        return res.status(200).json({qr:qrcode});
    }else if(act=="status"){
        if(status=="READY"){
            inc = (client.info)?client.info:false;
            if(inc){
                clientNumber = inc.wid.user;
                clientName = inc.pushname;
            }
        }
        return res.status(200).json({status,clientName,clientNumber});
    }else if(act=="send"){
        const num = req.body.number;
        const text = req.body.text;
        const r = await send(num,text);
        return (r=="SEND_SUCCESS")?res.status(200).json({success:true}):res.status(200).json({errorMsg:r});
    }else if(act=="send-base64"){
        const num = req.body.number;
        const caption = req.body.text;
        const base64 = req.body.base64;
        const mime = req.body.mime;
        const r = await send_base64(num,caption,base64,mime);
        return (r=="SEND_SUCCESS")?res.status(200).json({success:true}):res.status(200).json({errorMsg:r});
    }else if(act=="logout"){
        await client.logout().then(()=>{
            status="NOT READY";
            clientNumber = null;
            clientName = null;
            client.initialize();
        });
        console.log('WhatsApp Web On : LOGOUT');
        res.status(200).json({success:true});
    }else if(act=="gettemplate"){
        const db = new Expert("./db/template.json");
        await db.get();
        const like = (req.body.search)?req.body.search:'';
        const sort = (req.body.sort)?req.body.sort:"id";
        const order = (req.body.order)?req.body.order:"ASC";
        const limit = (req.body.rows)?req.body.rows:50;
        const page = (req.body.page)?req.body.page:1;
        const index = (page - 1) * limit;
        db.offset(index,limit);
        if(like){
            db.orderBy(sort,order);
            var hasil = db.regex(like);
        }else{
            var hasil = db.orderBy(sort,order);
        }
        let data ={total:hasil.length,rows:hasil}
       return res.status(200).json(data)
    }else if(act=="crudtemplate"){
        const db = new Expert("./db/template.json");
        const id = req.body.id;
        if(id=='insert'){
            req.body.dataHock = 1;
            req.body.class = 1;
            req.body.status = "true";
            req.body.id = moment().format("YYYYMMDDHmmss");
            req.body.createdAt = moment().format("DD-MM-YYYY HH:mm");
            const cek = await db.find({judul:req.body.judul});
            if(cek.length>0){
                return res.status(200).json({errorMsg:'Judul Sudah ada.'});
            }else{
                await db.insert(req.body);
                return res.status(200).json({success:true});
            }
        }else{
            req.body.updatedAt = moment().format("DD-MM-YYYY HH:mm");
            const o = await db.findOne({id});
            const cek = await db.find({judul:req.body.judul});
            if(cek.length<1 || o.judul==req.body.judul){
                await db.update({id},req.body);
                return res.status(200).json({success:true});
            }else{
                return res.status(200).json({errorMsg:'Judul Sudah ada.'});
            }
        }
    }else if(act=="deltemplate"){
        const db = new Expert("./db/template.json");
        const id = req.body.id;
        await db.remove({id});
        return res.status(200).json({success:true});
    }else if(act=="delfiletemplate"){
        const db = new Expert("./db/template.json");
        const id = req.body.id;
        req.body.updatedAt = moment().format("DD-MM-YYYY HH:mm");
        await db.update({id},{file:null,ext:null});
        return res.status(200).json({success:true});
    }else{
        return res.status(200).json({errorMsg:"fungsi tidak tersedia"});
    }
}
const Reply = async (req,res)=>{
    const act = req.params.act;
    const db = new Expert("./db/reply.json");
    if(act=="getdata"){
        await db.get(['class',1]);
        const like = (req.body.search)?req.body.search:'';
        const sort = (req.body.sort)?req.body.sort:"id";
        const order = (req.body.order)?req.body.order:"ASC";
        const limit = (req.body.rows)?req.body.rows:50;
        const page = (req.body.page)?req.body.page:1;
        const index = (page - 1) * limit;
        db.offset(index,limit);
        if(like){
            db.orderBy(sort,order);
            var hasil = db.regex(like);
        }else{
            var hasil = db.orderBy(sort,order);
        }
        let data ={total:hasil.length,rows:hasil}
       return res.status(200).json(data)
    }else if(act=="crud"){
        const id = req.body.id;
        if(id=='insert'){
            req.body.dataHock = 1;
            req.body.class = 1;
            req.body.status = "true";
            req.body.id = moment().format("YYYYMMDDHmmss");
            req.body.createdAt = moment().format("DD-MM-YYYY HH:mm");
            const cek = await db.find({text:req.body.text});
            if(cek.length>0){
                return res.status(200).json({errorMsg:'Chat Sudah ada.'});
            }else{
                await db.insert(req.body);
                return res.status(200).json({success:true});
            }
        }else{
            req.body.updatedAt = moment().format("DD-MM-YYYY HH:mm");
            const o = await db.findOne({id});
            const cek = await db.find({text:req.body.text});
            if(cek.length<1 || o.text==req.body.text){
                await db.update({id},req.body);
                return res.status(200).json({success:true});
            }else{
                return res.status(200).json({errorMsg:'Chat Sudah ada.'});
            }
        }
    }else if(act=="status"){
        const id = req.body.id;
        const status = req.body.status;
        req.body.updatedAt = moment().format("DD-MM-YYYY HH:mm");
        await db.update({id},{status});
        return res.status(200).json({success:true});
    }else if(act=="delete"){
        const id = req.body.id;
        await db.remove({id});
        return res.status(200).json({success:true});
    }else if(act=="deletefile"){
        const id = req.body.id;
        req.body.updatedAt = moment().format("DD-MM-YYYY HH:mm");
        await db.update({id},{file:null,ext:null});
        return res.status(200).json({success:true});
    }else if(act=="updateresp1"){
        const resp = req.body.val;
        await db.update({id:"1000"},{resp,updatedAt:moment().format("DD-MM-YYYY HH:mm")});
        return res.status(200).json({success:true});
    }else if(act=="updatestatus1"){
        const status = req.body.val;
        await db.update({id:"1000"},{status,updatedAt:moment().format("DD-MM-YYYY HH:mm")});
        return res.status(200).json({success:true});
    }else if(act=="updatefile1"){
        const ext = req.body.ext;
        if(ext!='png' && ext!='jpg' && ext!='jpeg' && ext!='pdf'){return res.status(200).json({errorMsg:"Extensi tidak di isinkan"});}
        const base64 = req.body.base64;
        await db.update({id:"1000"},{file:base64,ext,updatedAt:moment().format("DD-MM-YYYY HH:mm")});
        return res.status(200).json({success:true});
    }else if(act=="delfile1"){
        await db.update({id:"1000"},{file:null,ext:null,updatedAt:moment().format("DD-MM-YYYY HH:mm")});
        return res.status(200).json({success:true});
    }else if(act=="chatgpt"){
        const msg = req.body.msg;
        if(msg){
            try {
                const result = await chat.sendMessageStream(msg);
                let buffer="";
                for await (let response of result.stream) {
                    buffer += response.text()
                }
                return res.status(200).json({responseText:buffer});
            } catch (e) {
                return res.status(200).json({responseText:"Sorry server is down, please try again."});
            }
        }
    }else if(act=="saveaidoc"){
        const doc = req.body.val;
        if(doc){
            const ai = new Expert("./db/ai.json");
            await ai.update({id:"doc"},{doc});
             chat.sendMessageStream(doc.replaceAll('\n',','));
            return res.status(200).json({success:true});
        }
    }else{
        return res.status(200).json({errorMsg:"fungsi tidak tersedia"});
    }
}
const Broadcast = async (req,res)=>{
    const act = req.params.act;
    const db = new Expert("./db/broadcast.json");
    const log = new Expert("./db/broadcast_log.json");
    const temp = new Expert("./db/template.json");
    if(act=="getdata"){
        await db.get();
        const like = (req.body.search)?req.body.search:'';
        const sort = (req.body.sort)?req.body.sort:"id";
        const order = (req.body.order)?req.body.order:"ASC";
        const limit = (req.body.rows)?req.body.rows:50;
        const page = (req.body.page)?req.body.page:1;
        const index = (page - 1) * limit;
        db.offset(index,limit);
        if(like){
            db.orderBy(sort,order);
            var hasil = db.regex(like);
        }else{
            var hasil = db.orderBy(sort,order);
        }
        let data ={total:hasil.length,rows:hasil}
       return res.status(200).json(data)
    }else if(act=="getlog"){
         await log.get();
         var hasil = log.orderBy('tgl', 'DESC');
        let data ={total:hasil.length,rows:hasil}
        return res.status(200).json(data)
    }else if(act=="crud"){
        const id = req.body.id;
        if(id=='insert'){
            req.body.dataHock = 1;
            req.body.status = "true";
            req.body.id = moment().format("YYYYMMDDHmmss");
            req.body.createdAt = moment().format("DD-MM-YYYY HH:mm");
            const cek = await db.find({hp:req.body.hp});
            if(cek.length>0){
                return res.status(200).json({errorMsg:'no Hp Sudah ada.'});
            }else{
                await db.insert(req.body);
                return res.status(200).json({success:true});
            }
        }else{
            req.body.updatedAt = moment().format("DD-MM-YYYY HH:mm");
            const o = await db.findOne({id});
            const cek = await db.find({hp:req.body.hp});
            if(cek.length<1 || o.hp==req.body.hp){
                await db.update({id},req.body);
                return res.status(200).json({success:true});
            }else{
                return res.status(200).json({errorMsg:'no Hp Sudah ada.'});
            }
        }
    }else if(act=="truncate"){
        await db.remove({dataHock:1});
        return res.status(200).json({success:true});
    }else if(act=="truncatelog"){
        await log.remove({dataHock:1});
        return res.status(200).json({success:true});
    }else if(act=="delete"){
        const id = req.body.id;
        await db.remove({id});
        return res.status(200).json({success:true});
    }else if(act=="deletelog"){
        const id = req.body.id;
        await log.remove({id});
        return res.status(200).json({success:true});
    }else if(act=="row"){
        const row = await db.get();
        return res.status(200).json({row:row.length,log:moment().format("DD-MM-YYYY HH:mm:ss")});
    }else if(act=="send"){
        const id = req.params.id;
        const logval = req.body.log;
        const o = await temp.findOne({id});
        const x = await db.findOne({dataHock:1});
        const text = o.resp.replaceAll('#NAMA#',x.nama);
        const tm = moment().format("DD-MM-YYYY HH:mm:ss");
        let ps = '';
        if(o.file && o.ext){
            const mimetype = (o.ext=='pdf')?'application/'+o.ext:'image/'+o.ext;
            ps += await send_base64(x.hp,text,o.file,mimetype)
        }else{
            ps += await send(x.hp,text)
        }
        await db.remove({id:x.id})
        const cek = await log.find({id:btoa(logval)});
        if(cek.length>0){
            const d = await log.findOne({id:btoa(logval)});
            const text = d.text+tm+' -> '+x.hp+' -- '+x.nama+' : '+ps+'\n';
            await log.update({id:btoa(logval)},{id:btoa(logval),tgl:logval,text});
        }else{
            const text = tm+' -> '+x.hp+' -- '+x.nama+' : '+ps+'\n';
            await log.insert({id:btoa(logval),tgl:logval,text,dataHock:1});
        }
        return res.status(200).json({success:true});
    }else{
        return res.status(200).json({errorMsg:"fungsi tidak tersedia"});
    }
}
const filterNo = function(number) {
    let formatted = number.replace(/\D/g, '');
    if (formatted.startsWith('0')) {
       formatted = '62' + formatted.substr(1);
    }
    if (!formatted.endsWith('@c.us')) {
        formatted += '@c.us';
    }
    return formatted;
}
module.exports = {WhatsApp,Reply,Broadcast};