function openChat(){
    var accId = "";
    try{
        accId = window.app.getAppVersion() + '_' + window.app.getActiveCode();
    }catch(e){
    }
    
    var chatURL="https://chat66.dotcomuse9.com/index/index/home?visiter_id=&visiter_name=" + accId +"&avatar=&business_id=1&groupid=0&special=1&theme=7571f9";
    try{
        window.app.ShowFullWebView('url:'+chatURL,1);
    }catch(e){
        window.app.OpenURL(chatURL);
    }
}
