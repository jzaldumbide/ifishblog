var ie = (function(){

    var undef,
        v = 3,
        div = document.createElement('div'),
        all = div.getElementsByTagName('i');

    while (
        div.innerHTML = '<!--[if gt IE ' + (++v) + ']><i></i><![endif]-->',
        all[0]
    );

    return v > 4 ? v : undef;

}());

if (ie){
  alert("Unfortunately Internet Explorer is not Supported. Please try the latest versions of Google Chrome, Safari or Firefox.")
}