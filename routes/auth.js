const express = require('express');
const router = express.Router();
const firebaseClient = require('../connections/firebase_client');
const firebaseAdminDb = require('../connections/firebase_admin');
const fireAuth = firebaseClient.auth();
//get
router.get('/', function (req, res) {
});
router.get('/success',function(req,res){
    res.render('dashboard/success',{
        title:'註冊成功'
    });
});

router.get('/signout', function (req, res) {
    res.render('dashboard/signout',{
        title:'確認登出嗎?'
    });
})
router.get('/signout/ture', function (req, res) {
    req.session.uid = '';
    res.redirect('/auth/login');
})

router.get('/login', function (req, res) {
    let error= req.flash('error');
    if(req.session.uid){
        res.redirect('/dashboard/archives');
    }else{
        res.render('dashboard/login', {
            title: '登入',
            error: error,
            hasInfo: error.length > 0
        });
    }
})


router.get('/signup', function (req, res) {
    let error= req.flash('error');
    if(req.session.uid){
            res.render('dashboard/signup', {
            title: '註冊',
            error: error,
            hasInfo: error.length > 0,
            });
    }else{
        res.redirect('login');
    }
});


//post
router.post('/login', function (req, res) {
    let email = req.body.email,
        password = req.body.password;
    fireAuth.signInWithEmailAndPassword(email, password)
    .then(function(result){
        req.session.uid = result.user.uid;
        res.redirect('/dashboard/archives');
    })
    .catch(function(error) {
      var errorMsg = error.code;
      console.log(error);
        switch(errorMsg){
            case 'auth/wrong-password':
                req.flash('error',"登入失敗 : 密碼錯誤");
                break;
            case 'auth/user-not-found':
                req.flash('error',"登入失敗 : 無此用戶，請註冊新帳號");
                break;
        }
      res.redirect('login');
    });
})
router.post('/signup', function (req, res) {
    let email = req.body.email,
        password = req.body.password,
        confirm_password = req.body.confirm_password,
        nickname = req.body.nickname;
        console.log(`email:${email}, password:${password},  confirm_password: ${confirm_password}, nickname: ${nickname}`);
    if(password === confirm_password){
        fireAuth.createUserWithEmailAndPassword(email, password)
        .then(function(result){
            // console.log(result);
            console.log('Uid:' + result.user.uid);
            let saveUser = {
                'email': email,
                'nickname': nickname,
                'uid': result.user.uid
            }
            firebaseAdminDb.ref('/users/' + result.user.uid ).set(saveUser);
            res.redirect('success');
        })
        .catch(function(error){
            let errorMsg = error.code;
            console.log(error);
            switch (errorMsg){
                case 'auth/weak-password':
                    req.flash('error','註冊失敗:密碼最少須填寫6個字母');
                    break;
                case 'auth/email-already-in-use':
                    req.flash('error','註冊失敗:此信箱已被註冊過');
                    break;
            }
            res.redirect('signup');
        });
    }else{
        req.flash('error', '確認密碼不正確');
        res.redirect('signup');
    }
});


module.exports = router;