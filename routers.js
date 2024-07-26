const Authenticate = require("./conrollers/Auth")
const Setting = require("./conrollers/Setting")
const { imgToInc , excBroadcast} = require("./conrollers/UploadImg")
const { mData, App , Auth , Guest , Api , replyData, aiData, tempData} = require("./middleware")
const { WhatsApp , Reply ,Broadcast} = require("./conrollers/Whatsapp")

const express = require('express');
const router = express.Router();
const path = require("path");
const fs = require('fs');
const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();
const multer = require('multer')
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'assets/img/')
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        const mime = file.mimetype
        cb(null, uniqueSuffix + '.' + mime.split("/")[1])
  }
})
const upload = multer({ storage: storage })
router.post('/img-to-inc', Api , upload.single('file'), imgToInc)
router.post('/exc-broadcast', Api , upload.single('file'), excBroadcast)

router.get('/', function (req, res) {return res.redirect('/login');});
router.get('/info/:text', mData , function (req, res) {
    res.render('auth/info',{
        layout: "main",
        Title:"Informasi",
        text: req.params.text
    });
});

router.get('/setting', Auth, mData , function (req, res) {
    res.render('main/setting',{
        layout: "main",
        Title:"App Setting",
        INC: req.inc
    });
});
router.post('/setting/:act/:id?' , Api ,jsonParser, Setting);
router.post('/whatsapp/:act' , Api, jsonParser, WhatsApp);

router.get('/endpoint', Auth, mData , function (req, res) {
    res.render('wa/endpoint',{
        layout: "main",
        Title:"EndPoint",
        INC: req.inc
    });
});
router.get('/google', Auth, mData , aiData, function (req, res) {
    res.render('wa/google',{
        layout: "main",
        Title:"Google Ai",
        INC: req.inc,
        DOC: req.ai
    });
});
router.get('/reply', Auth, mData , replyData, function (req, res) {
    res.render('wa/reply',{
        layout: "main",
        Title:"Auto Reply",
        INC: req.inc,
        REP: req.reply
    });
});
router.post('/reply/:act' , Api, jsonParser, Reply);
router.get('/broadcast', Auth, mData , tempData , function (req, res) {
    res.render('wa/broadcast',{
        layout: "main",
        Title:"Broadcasting",
        INC: req.inc,
        TEMP:req.template
    });
});
router.post('/broadcast/:act/:id?' , Api, jsonParser, Broadcast);
router.get('/template', Auth, mData , function (req, res) {
    res.render('wa/template',{
        layout: "main",
        Title:"TEMPLATE",
        INC: req.inc
    });
});
router.get('/skedule', Auth, mData , function (req, res) {
    res.render('wa/skedule',{
        layout: "main",
        Title:"SKEDULE",
        INC: req.inc
    });
});

router.get('/app', App, mData , function (req, res) {
    res.render('app',{
        layout: "app",
        Title:"Dashboard",
        ME: req.me,
        INC: req.inc
    });
});
router.get('/readme', mData , function (req, res) {
    res.render('main/readme',{
        layout: "main",
        Title:"Readme",
        INC: req.inc
    });
});
router.get('/login', Guest , mData , function (req, res) {
    res.render('auth/login',{
        layout: "auth",
        Title:"Login Page",
        INC: req.inc
    });
});

router.post('/auth/:act/:id?' , Api ,jsonParser, Authenticate);

router.get('/scripts/easyuimetro/:name?' , function(req,res){
    let root = './assets/scripts/easyui/themes/metro/'+req.params.name;
    if (fs.existsSync(root)){
        res.sendFile(path.join(__dirname,'assets/scripts/easyui/themes/metro/'+req.params.name));
    }else{
        res.sendFile(path.join(__dirname,'assets/404.html'));
    }
});
router.get('/scripts/easyui-ui-pepper-grinder/:name?' , function(req,res){
    let root = './assets/scripts/easyui/tema/ui-pepper-grinder/'+req.params.name;
    if (fs.existsSync(root)){
        res.sendFile(path.join(__dirname,'assets/scripts/easyui/tema/ui-pepper-grinder/'+req.params.name));
    }else{
        res.sendFile(path.join(__dirname,'assets/404.html'));
    }
});
router.get('/scripts/easyui-ui-pepper-grinder/images/:name?' , function(req,res){
    let root = './assets/scripts/easyui/tema/ui-pepper-grinder/images/'+req.params.name;
    if (fs.existsSync(root)){
        res.sendFile(path.join(__dirname,'assets/scripts/easyui/tema/ui-pepper-grinder/images/'+req.params.name));
    }else{
        res.sendFile(path.join(__dirname,'assets/404.html'));
    }
});
router.get('/scripts/:dir/:name?' , function(req,res){
    let root = './assets/scripts/'+req.params.dir+'/'+req.params.name;
    if (fs.existsSync(root)){
        res.sendFile(path.join(__dirname,'assets/scripts/'+req.params.dir+'/'+req.params.name));
    }else{
        res.sendFile(path.join(__dirname,'assets/404.html'));
    }
});
router.get('/fontawesome-free-6.2.1-web/:dir/:name?' , function(req,res){
    let root = './assets/scripts/fontawesome-free-6.2.1-web/'+req.params.dir+'/'+req.params.name;
    if (fs.existsSync(root)){
        res.sendFile(path.join(__dirname,'assets/scripts/fontawesome-free-6.2.1-web/'+req.params.dir+'/'+req.params.name));
    }else{
        res.sendFile(path.join(__dirname,'assets/404.html'));
    }
});
router.get('/img/:name?' , function(req,res){
    let root = './assets/img/'+req.params.name;
    if (fs.existsSync(root)){
        res.sendFile(path.join(__dirname,'assets/img/'+req.params.name));
    }else{
        res.sendFile(path.join(__dirname,'assets/404.html'));
    }
});

module.exports = router;