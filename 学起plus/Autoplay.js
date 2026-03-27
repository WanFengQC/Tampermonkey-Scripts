// ==UserScript==
// @name         学起plus自动连播
// @namespace    http://tampermonkey.net/
// @version      V1.0
// @description  当前视频播放结束后自动进入下一课
// @author       WanFengQC
// @icon         https://images-eds-ssl.xboxlive.com/image?url=4rt9.lXDC4H_93laV1_eHHFT949fUipzkiFOBH3fAiZZUCdYojwUyX2aTonS1aIwMrx6NUIsHfUHSLzjGJFxxmExBZ_WBe9twW6n1MX62LnnDx7lEcEG1S6GaubVFiZuvOBzvB4wupq4yvAjW06oE42TUVNg5sZy5mLhetfMxvw-&format=webp&h=115
// @match        *://*.sccchina.net/venus/study/activity/video/study.do*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    let hasTriggered = false;

    function getVideo() {
        return document.querySelector('video');
    }

    function goNext() {
        if (hasTriggered) return;
        hasTriggered = true;

        console.log('[自动下一课] 准备进入下一课');

        try {
            if (typeof window.doNext === 'function') {
                console.log('[自动下一课] 调用 doNext()');
                window.doNext();
                return;
            }
        } catch (e) {
            console.log('[自动下一课] doNext() 调用失败:', e);
        }

        const btn = document.querySelector('.frameBtn-course_next');
        if (btn) {
            console.log('[自动下一课] 点击 .frameBtn-course_next');
            btn.click();
            return;
        }

        console.log('[自动下一课] 没找到下一课方法');
    }

    function bindVideo(video) {
        if (!video || video.dataset.autoNextBound === '1') return;
        video.dataset.autoNextBound = '1';
        hasTriggered = false;

        console.log('[自动下一课] 已绑定视频', video);

        video.addEventListener('ended', () => {
            console.log('[自动下一课] 检测到 ended 事件');
            setTimeout(goNext, 1500);
        });

        // 兜底：有些播放器 ended 不稳定
        const timer = setInterval(() => {
            if (!document.contains(video)) {
                clearInterval(timer);
                return;
            }

            if (!video.duration || isNaN(video.duration)) return;

            const remain = video.duration - video.currentTime;

            if (remain <= 0.3 && (video.ended || video.paused)) {
                console.log('[自动下一课] 检测到视频接近结束，执行兜底跳转');
                clearInterval(timer);
                setTimeout(goNext, 1200);
            }
        }, 2000);
    }

    function scanAndBind() {
        const video = getVideo();
        if (video) {
            bindVideo(video);
        } else {
            console.log('[自动下一课] 暂未找到 video');
        }
    }

    // 首次执行
    scanAndBind();

    // 适配页面局部刷新
    const observer = new MutationObserver(() => {
        scanAndBind();
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // 定时兜底扫描
    setInterval(scanAndBind, 3000);
})();
