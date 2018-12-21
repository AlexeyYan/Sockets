moment.locale('ru')
$(document).ready(function () {
    if ("WebSocket" in window) {
        websocket = true;
    } else {
        websocket = false;
    }
    var msg = {};
    var key = "";
    var id = 0;
    var attach_list = [];
    var ws = new WebSocket("wss://my-chat-socket.herokuapp.com/");
    var dropZone = $('.upload-container');

    ws.onopen = function () {
        console.log("Was connected!");
        document.getElementById("loginbox").className = "lshow";
        $('#register').on('click', function () {
            document.getElementById("loginbox").className = "hidden";
            document.getElementById("registerbox").className = "rshow";
        });
        $('#registerbutton').on('click', function () {
            if (document.forms["registerbox"]["rname"].value != '' && document.forms["registerbox"]["name"].value != '') {
                msg = JSON.stringify({ event: 'register', name: document.forms["registerbox"]["rname"].value, email: document.forms["registerbox"]["email"].value, passwd: document.forms["registerbox"]["rpasswd"].value, });
                console.log("Register");
                ws.send(msg);
            }
        });
        $('#loginbutton').on('click', function () {
            if (document.forms["loginbox"]["name"].value != '' && document.forms["loginbox"]["passwd"].value != '') {
                msg = JSON.stringify({ event: 'login', name: document.forms["loginbox"]["name"].value, passwd: document.forms["loginbox"]["passwd"].value, });
                console.log("Login");
                ws.send(msg);
            }
        });
    };


    ws.onmessage = function (evt) {
        var event = JSON.parse(evt.data);
        //console.log(evt.data);
        if (event.event == 'message') {
            if (event.author.id == id) {
                $('.messages').append('<li><div><div class="myMessage">' + event.author.name + ':  ' + event.text + attach(event.attachments) + '<i>' + moment(event.timestamp).utcOffset(+6.00).calendar() + '</div></div></li><li></li>');
            }
            else {
                $('.messages').append('<li><div><div class="otherMessage">' + event.author.name + ':  ' + event.text + attach(event.attachments) + '<i>' + moment(event.timestamp).utcOffset(+6.00).calendar() + '</div></div></li><li></li>');
            }
            $('.messages').append('<div class="clear"></div>');
            console.log('Received message');
        }
        if (event.event == 'connect') {
            $('.messages').append('<li><div><div class="clear" style="text-align: center;">' + event.user + ' connected!</div></div></li>');
        }
        if (event.event == 'login' && event.errors == 0) {
            key = event.key;
            id = event.id;
            //console.log(event.key);
            document.getElementById("loginbox").className = "hidden";
            //console.log("id=" + id);
            setInterval(function () { ws.send(JSON.stringify({ event: 'alive', key: key })); }, 30000);
        }

        if (event.event == 'register') {
            if (event.status != "OK") {
                document.getElementById("error").innerHTML = event.error;
            }
            else {
                document.getElementById("registerbox").className = "hidden";
                window.location.reload();
            }
        }

        if (event.event == 'messagedump') {
            console.log(event.messages);
            for (var message in event.messages) {
                var author = event.messages[message].author;
                var attachments = event.messages[message].attachments;
                //console.log(event.messages[message].text);
                if (author.id == id) {
                    $('.messages').append('<li><div><div class="myMessage">' + author.name + ':  ' + event.messages[message].text + attach(attachments) + '<i>' + moment(event.messages[message].timestamp).utcOffset(+6.00).calendar() + '</div></div></li><li></li>');
                }
                else {
                    $('.messages').append('<li><div><div class="otherMessage">' + author.name + ':  ' + event.messages[message].text + attach(attachments) + '<i>' + moment(event.messages[message].timestamp).utcOffset(+6.00).calendar() + '</div></div></li><li></li>');
                }
                $('.messages').append('<li><div class="clear"></div></li>');
            }
        }

        if(event.event == 'attach_response'){
            console.log(event.files);
            attach_list=event.files;
        }
    };
    //Прикрепление вложения
    dropZone.on('drag dragstart dragend dragover dragenter dragleave drop', function () {
        return false;
    });

    dropZone.on('dragover dragenter', function () {
        dropZone.addClass('dragover');
    });

    dropZone.on('dragleave', function (e) {
        dropZone.removeClass('dragover');
    });

    dropZone.on('drop', function (e) {
        dropZone.removeClass('dragover');
        let files = e.originalEvent.dataTransfer.files;
        sendFiles(files);
        document.getElementById("photo_handler").className = "hidden";
        
    });

    $('#file-input').change(function () {
        let files = this.files;
        sendFiles(files);
    });
    //Отправка сообщения
    document.onkeyup = function (e) {
        if (e.keyCode == 13) {
            if ($('#myMessage').val() != '') {
                var messag = $('#myMessage').val().replace(/<\/?[^>]+(>|$)/g, "");
                if (messag != '') {
                    msg = JSON.stringify({ event: 'message', message: messag, key: key, attachments: attach_list, });
                    ws.send(msg);
                }
                $('#myMessage').val('');
                attach_list = [];
            }
        }
    };

    $('#sendbutton').on('click', function () {
        if ($('#myMessage').val() != '') {
            var messag = $('#myMessage').val().replace(/<\/?[^>]+(>|$)/g, "");
            if (messag != '') {
                msg = JSON.stringify({ event: 'message', message: messag, key: key, attachments: attach_list, });
                ws.send(msg);
                $('#myMessage').val('');
                attach_list = [];
            }
        }
    });

    $('.photo_attachment').on('click', function () {
        document.getElementById("photo_handler").className = "photoh_show";
    });

    ws.onclose = function () {
        console.log("Connection closed...");
        alert("Connection closed...")
    };

    function sendFiles(files) {
        let Data = new FormData();
        $(files).each(function (index, file) {
            console.log(file);
            Data.append('key',key);
            Data.append('files[]', file);
            console.log(Data);
            $.ajax({
                url: "/upload",
                type: "POST",
                data: Data,
                contentType: false,
                processData: false,
            });
        });
    };

    //Обработка вложений 
    function attach(attachments) {
        if (attachments==null) return '';
        var attachm = '';
        for (var attachment in attachments) {
            if (attachments[attachment].type == 'image/png' || attachments[attachment].type == 'image/jpeg' ) {
                attachm += '<img id="attachment_photo" src="' + attachments[attachment].link + '"><br>';
            }
        }
        console.log('att' + attachm);
        return attachm;
    }



});	  