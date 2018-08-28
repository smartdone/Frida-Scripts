package com.example.smartdone.httptest;

import android.annotation.SuppressLint;
import android.os.Handler;
import android.os.Message;
import android.support.v7.app.AppCompatActivity;
import android.os.Bundle;
import android.view.View;
import android.widget.Button;
import android.widget.TextView;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLConnection;

public class MainActivity extends AppCompatActivity implements View.OnClickListener {

    private TextView textView;
    private String url = "http://www.baidu.com";
    private int REC = 1;

    @SuppressLint("HandlerLeak")
    private Handler handler = new Handler(){
        @Override
        public void handleMessage(Message msg) {
            super.handleMessage(msg);
            if(msg.what == REC) {
                textView.setText(msg.obj.toString());
            }
        }
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);
        Button button = findViewById(R.id.button);
        Button okhttpbtn = findViewById(R.id.okhttphtn);
        textView = findViewById(R.id.text);
        button.setOnClickListener(this);
        okhttpbtn.setOnClickListener(this);
    }

    @Override
    public void onClick(View view) {
        if(view.getId() == R.id.button) {
            new Thread(){
                @Override
                public void run() {
                    super.run();
                    try {
                        URL httpurl = new URL(url);
                        HttpURLConnection conn = (HttpURLConnection) httpurl.openConnection();
                        conn.setRequestMethod("GET");
                        conn.connect();
                        int code = conn.getResponseCode();
                        if (code == 200) {
                            BufferedReader bufReader=new BufferedReader(new InputStreamReader(conn.getInputStream(),"UTF-8"));
                            String result = "";
                            String line = bufReader.readLine();
                            while (line != null) {
                                result += line;
                                line = bufReader.readLine();InputStream inputStream = conn.getInputStream();
                            }

                            Message msg = new Message();
                            msg.what = REC;
                            msg.obj = result;
                            handler.sendMessage(msg);
                        }
                    } catch (Exception e) {
                        e.printStackTrace();
                        Message message = new Message();
                        message.what = REC;
                        message.obj = e.getMessage();
                        handler.sendMessage(message);
                    }
                }
            }.start();
        } else if(view.getId() == R.id.okhttphtn) {
            new Thread() {
                @Override
                public void run() {
                    super.run();
                }
            }.start();
        }
    }
}
