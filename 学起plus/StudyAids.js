// ==UserScript==
// @name         学起plus学习助手
// @namespace    https://github.com/WanFengQC/Tampermonkey-Scripts
// @version      V3.1.6
// @description  自动定位未达标课程与未完成小节，并在视频页自动进入下一课，支持悬浮球控制、自动恢复播放、视频静音
// @author       WanFengQC
// @icon         https://images-eds-ssl.xboxlive.com/image?url=4rt9.lXDC4H_93laV1_eHHFT949fUipzkiFOBH3fAiZZUCdYojwUyX2aTonS1aIwMrx6NUIsHfUHSLzjGJFxxmExBZ_WBe9twW6n1MX62LnnDx7lEcEG1S6GaubVFiZuvOBzvB4wupq4yvAjW06oE42TUVNg5sZy5mLhetfMxvw-&format=webp&h=115
// @match        *://cjyw.hdu.edu.cn/student/*
// @match        *://*.sccchina.net/venus/study/index/study.do*
// @match        *://*.sccchina.net/venus/study/activity/video/study.do*
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_addValueChangeListener
// ==/UserScript==

(function () {
    'use strict';

    const DEBUG = true;

    const SETTINGS_KEY = 'xq_nav_settings_v316';
    const FAB_POS_KEY = 'xq_nav_fab_pos_v316';

    const defaultSettings = {
        enabled: true,
        autoOpenCourse: true,
        autoOpenLesson: true,
        autoNextVideo: true,
        autoResumeVideo: true,
        autoMuteVideo: true
    };

    let settings = loadSettings();
    let hasTriggered = false;
    let lastPanelText = '';
    let rerunLock = false;

    function log(...args) {
        if (DEBUG) {
            console.log('[学起3.1.6]', ...args);
        }
    }

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function loadSettings() {
        try {
            const saved = GM_getValue(SETTINGS_KEY, null);
            if (!saved) {
                return { ...defaultSettings };
            }
            return { ...defaultSettings, ...saved };
        } catch (e) {
            return { ...defaultSettings };
        }
    }

    function saveSettings() {
        GM_setValue(SETTINGS_KEY, settings);
    }

    function loadFabPos() {
        try {
            return GM_getValue(FAB_POS_KEY, { top: 120, right: 20 });
        } catch (e) {
            return { top: 120, right: 20 };
        }
    }

    function saveFabPos(pos) {
        GM_setValue(FAB_POS_KEY, pos);
    }

    function addStyle() {
        if (document.getElementById('xq-nav-style')) {
            return;
        }

        const style = document.createElement('style');
        style.id = 'xq-nav-style';
        style.textContent = `
            .xq-nav-course {
                outline: 2px solid #fa8c16 !important;
                background: #fff7e6 !important;
                border-radius: 6px !important;
            }

            .xq-nav-lesson {
                outline: 2px solid #1677ff !important;
                background: #f0f7ff !important;
                border-radius: 6px !important;
            }

            .xq-nav-badge {
                display: inline-block;
                margin-left: 8px;
                padding: 2px 8px;
                font-size: 12px;
                color: #fff;
                background: #fa8c16;
                border-radius: 999px;
                vertical-align: middle;
                line-height: 18px;
            }

            .xq-nav-panel {
                position: fixed;
                right: 20px;
                bottom: 20px;
                z-index: 99999;
                background: rgba(0, 0, 0, 0.78);
                color: #fff;
                padding: 10px 14px;
                border-radius: 8px;
                font-size: 13px;
                box-shadow: 0 4px 14px rgba(0, 0, 0, 0.2);
                max-width: 420px;
                word-break: break-all;
            }

            .xq-nav-btn {
                margin-left: 10px;
                padding: 2px 10px;
                border: none;
                border-radius: 4px;
                background: #1677ff;
                color: #fff;
                cursor: pointer;
                font-size: 12px;
                line-height: 20px;
            }

            .xq-fab {
                position: fixed;
                z-index: 100000;
                width: 50px;
                height: 50px;
                border-radius: 50%;
                border: none;
                background: #1677ff;
                color: #fff;
                font-size: 20px;
                cursor: grab;
                box-shadow: 0 6px 18px rgba(0, 0, 0, 0.2);
                user-select: none;
            }

            .xq-fab:active {
                cursor: grabbing;
            }

            .xq-drawer {
                position: fixed;
                z-index: 100000;
                width: 330px;
                background: #fff;
                color: #333;
                border-radius: 12px;
                box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);
                padding: 14px;
                font-size: 14px;
                display: none;
            }

            .xq-drawer.show {
                display: block;
            }

            .xq-drawer h3 {
                margin: 0 0 12px 0;
                font-size: 16px;
            }

            .xq-row {
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin: 10px 0;
                gap: 10px;
            }

            .xq-row label {
                flex: 1;
                line-height: 1.4;
            }

            .xq-switch {
                width: 18px;
                height: 18px;
            }

            .xq-actions {
                display: flex;
                gap: 10px;
                margin-top: 14px;
            }

            .xq-action-btn {
                flex: 1;
                border: none;
                border-radius: 8px;
                padding: 8px 10px;
                cursor: pointer;
                color: #fff;
                font-size: 13px;
            }

            .xq-start {
                background: #16a34a;
            }

            .xq-stop {
                background: #dc2626;
            }

            .xq-status {
                margin-top: 10px;
                font-size: 12px;
                color: #666;
            }
        `;
        document.head.appendChild(style);
    }

    function ensurePanel() {
        let panel = document.querySelector('.xq-nav-panel');
        if (!panel) {
            panel = document.createElement('div');
            panel.className = 'xq-nav-panel';
            document.body.appendChild(panel);
        }
        return panel;
    }

    function showPanel(text) {
        const panel = ensurePanel();
        if (lastPanelText !== text) {
            panel.textContent = text;
            lastPanelText = text;
        }
    }

    function parseTimeToSeconds(str) {
        if (!str) {
            return null;
        }

        const parts = str.trim().split(':').map(Number);
        if (parts.some(Number.isNaN)) {
            return null;
        }

        if (parts.length === 2) {
            return parts[0] * 60 + parts[1];
        }

        if (parts.length === 3) {
            return parts[0] * 3600 + parts[1] * 60 + parts[2];
        }

        return null;
    }

    function isStudyListPage() {
        return location.hostname.includes('cjyw.hdu.edu.cn') &&
               location.href.includes('#Subpage/Study');
    }

    function isCourseIndexPage() {
        return location.hostname.includes('sccchina.net') &&
               location.pathname.includes('/venus/study/index/study.do');
    }

    function isVideoPage() {
        return location.hostname.includes('sccchina.net') &&
               location.pathname.includes('/venus/study/activity/video/study.do');
    }

    function markTitle(el, text) {
        if (!el || el.querySelector('.xq-nav-badge')) {
            return;
        }

        const badge = document.createElement('span');
        badge.className = 'xq-nav-badge';
        badge.textContent = text;
        el.appendChild(badge);
    }

    function triggerRealClick(el) {
        if (!el) {
            return false;
        }

        el.dispatchEvent(new MouseEvent('mousedown', {
            bubbles: true,
            cancelable: true,
            view: window
        }));

        el.dispatchEvent(new MouseEvent('mouseup', {
            bubbles: true,
            cancelable: true,
            view: window
        }));

        el.dispatchEvent(new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            view: window
        }));

        return true;
    }

    function installWindowOpenPatch() {
        if (window.__xqOpenPatched) {
            return;
        }

        window.__xqOpenPatched = true;
        const originalOpen = window.open;

        window.open = function (url, target, features) {
            log('拦截 window.open:', url, target, features);

            if (typeof url === 'string' && url.trim()) {
                location.href = url;
                return window;
            }

            return originalOpen ? originalOpen.apply(this, arguments) : null;
        };
    }

    async function waitForStudyCards(maxTry = 20) {
        for (let i = 0; i < maxTry; i++) {
            if (document.querySelectorAll('.in-c-el').length > 0) {
                return true;
            }
            await sleep(500);
        }
        return false;
    }

    async function waitForLessonItems(maxTry = 20) {
        for (let i = 0; i < maxTry; i++) {
            if (document.querySelectorAll('ul.unitLevelList li').length > 0) {
                return true;
            }
            await sleep(500);
        }
        return false;
    }

    function clearRuntimeControlOnPause() {
        const video = document.querySelector('video');
        if (video) {
            video.muted = false;
        }
    }

    function applyImmediateVideoSettings() {
        const video = document.querySelector('video');
        if (!video) {
            return;
        }

        if (settings.enabled) {
            video.muted = !!settings.autoMuteVideo;
        } else {
            video.muted = false;
        }
    }

    function runStudyListPage() {
        installWindowOpenPatch();

        const cards = [...document.querySelectorAll('.in-c-el')];
        const incompleteCourses = [];

        cards.forEach((card, index) => {
            const text = (card.innerText || '').replace(/\s+/g, ' ');
            const match = text.match(/总时长:\s*([\d.]+)\s*\/\s*([\d.]+|--+)/);

            if (!match) {
                return;
            }

            const learned = parseFloat(match[1]);
            const required = match[2].includes('--') ? null : parseFloat(match[2]);

            if (required == null) {
                return;
            }

            if (learned >= required) {
                return;
            }

            const titleEl = card.querySelector('.in-c-el-summarize');
            const title = (titleEl?.innerText || `课程${index + 1}`).trim();
            const learnBtn = card.querySelector('a.videolearning-bt:not(.in-c-disabledbt)');

            if (!learnBtn) {
                return;
            }

            card.classList.add('xq-nav-course');
            markTitle(titleEl, '未完成');

            incompleteCourses.push({
                title,
                learned,
                required,
                card,
                learnBtn
            });
        });

        log('第一页未完成课程:', incompleteCourses);

        if (incompleteCourses.length === 0) {
            showPanel('第一页未发现未达标课程。');
            return;
        }

        const first = incompleteCourses[0];
        showPanel(`已定位未达标课程 ${incompleteCourses.length} 门，当前目标：${first.title}`);

        if (!first.card.querySelector('.xq-nav-btn')) {
            const btn = document.createElement('button');
            btn.className = 'xq-nav-btn';
            btn.textContent = '打开这门课';
            btn.onclick = () => triggerRealClick(first.learnBtn);

            const targetRow = [...first.card.querySelectorAll('.in-c-el-property')]
                .find(row => (row.innerText || '').includes('总时长'));

            if (targetRow) {
                targetRow.appendChild(btn);
            }
        }

        if (settings.enabled && settings.autoOpenCourse) {
            setTimeout(() => {
                triggerRealClick(first.learnBtn);
            }, 1200);
        }
    }

    function runCourseIndexPage() {
        const lessonItems = [...document.querySelectorAll('ul.unitLevelList li')];
        const incompleteLessons = [];

        lessonItems.forEach(li => {
            const timeSpan = li.querySelector('span.n');
            const actEl = li.querySelector('i[onclick*="beginStudy"]');

            if (!timeSpan || !actEl) {
                return;
            }

            const raw = (timeSpan.textContent || '').replace(/\s+/g, '');
            const match = raw.match(/^(\d{1,2}:\d{2}(?::\d{2})?)\/(\d{1,2}:\d{2}(?::\d{2})?)$/);

            if (!match) {
                return;
            }

            const learned = parseTimeToSeconds(match[1]);
            const total = parseTimeToSeconds(match[2]);

            if (learned == null || total == null) {
                return;
            }

            if (learned >= total) {
                return;
            }

            const titleEl = li.querySelector('strong');
            const title = (titleEl?.textContent || '未命名小节').trim();

            li.classList.add('xq-nav-lesson');
            markTitle(titleEl, '未完成');

            incompleteLessons.push({
                title,
                li,
                actEl,
                learned,
                total
            });
        });

        log('第二页未完成小节:', incompleteLessons);

        if (incompleteLessons.length === 0) {
            showPanel('当前课程下未发现未完成小节。');
            return;
        }

        const first = incompleteLessons[0];
        showPanel(`已定位未完成小节 ${incompleteLessons.length} 个，当前目标：${first.title}`);

        if (!first.li.querySelector('.xq-nav-btn')) {
            const btn = document.createElement('button');
            btn.className = 'xq-nav-btn';
            btn.textContent = '进入学习';
            btn.onclick = () => triggerRealClick(first.actEl);

            const container = first.li.querySelector('.other') || first.li;
            container.appendChild(btn);
        }

        first.li.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
        });

        if (settings.enabled && settings.autoOpenLesson) {
            setTimeout(() => {
                triggerRealClick(first.actEl);
            }, 1200);
        }
    }

    function getVideo() {
        return document.querySelector('video');
    }

    function goNext() {
        if (!settings.enabled || !settings.autoNextVideo) {
            return;
        }

        if (hasTriggered) {
            return;
        }

        hasTriggered = true;
        log('视频页：准备进入下一课');

        try {
            if (typeof window.doNext === 'function') {
                window.doNext();
                return;
            }
        } catch (e) {
            log('视频页：doNext() 调用失败:', e);
        }

        const btn = document.querySelector('.frameBtn-course_next');
        if (btn) {
            btn.click();
        }
    }

    function bindVideo(video) {
        if (!video) {
            return;
        }

        if (video.dataset.autoNextBound !== '1') {
            video.dataset.autoNextBound = '1';
            hasTriggered = false;

            video.addEventListener('ended', () => {
                if (settings.enabled && settings.autoNextVideo) {
                    setTimeout(goNext, 1500);
                }
            });

            const nextTimer = setInterval(() => {
                if (!document.contains(video)) {
                    clearInterval(nextTimer);
                    return;
                }

                if (!video.duration || isNaN(video.duration)) {
                    return;
                }

                const remain = video.duration - video.currentTime;
                if (remain <= 0.3 && (video.ended || video.paused)) {
                    clearInterval(nextTimer);
                    if (settings.enabled && settings.autoNextVideo) {
                        setTimeout(goNext, 1200);
                    }
                }
            }, 2000);
        }

        if (settings.enabled) {
            video.muted = !!settings.autoMuteVideo;
        }

        if (video.dataset.autoResumeBound !== '1') {
            video.dataset.autoResumeBound = '1';

            const resumeTimer = setInterval(() => {
                if (!document.contains(video)) {
                    clearInterval(resumeTimer);
                    return;
                }

                if (settings.enabled) {
                    video.muted = !!settings.autoMuteVideo;

                    if (
                        settings.autoResumeVideo &&
                        video.paused &&
                        !video.ended &&
                        video.readyState >= 2
                    ) {
                        video.play().catch(() => {});
                    }
                }
            }, 2000);
        }
    }

    function scanAndBindVideo() {
        const video = getVideo();

        if (video) {
            bindVideo(video);

            let text = '已进入视频页。';

            if (settings.enabled && settings.autoNextVideo) {
                text = '已进入待学习视频页，当前视频结束后将自动进入下一课。';
            } else if (settings.enabled && !settings.autoNextVideo) {
                text = '已进入视频页，自动下一课当前关闭。';
            }

            if (settings.enabled && settings.autoResumeVideo) {
                text += ' 已开启自动恢复播放。';
            }

            if (settings.enabled && settings.autoMuteVideo) {
                text += ' 已开启静音。';
            }

            showPanel(text);
        } else {
            showPanel('已进入视频页，但暂未检测到 video 元素。');
        }
    }

    function renderControlUI() {
        if (document.getElementById('xq-fab')) {
            return;
        }

        const pos = loadFabPos();

        const fab = document.createElement('button');
        fab.id = 'xq-fab';
        fab.className = 'xq-fab';
        fab.textContent = '⚙';
        fab.style.top = `${pos.top}px`;
        fab.style.right = `${pos.right}px`;

        const drawer = document.createElement('div');
        drawer.id = 'xq-drawer';
        drawer.className = 'xq-drawer';

        function placeDrawer() {
            const fabRect = fab.getBoundingClientRect();
            drawer.style.top = `${fabRect.top + 58}px`;
            drawer.style.right = `${Math.max(20, window.innerWidth - fabRect.right)}px`;
        }

        drawer.innerHTML = `
            <h3>学起 3.1.6 控制面板</h3>

            <div class="xq-row">
                <label>自动打开第一门未达标课程</label>
                <input id="xq-auto-course" class="xq-switch" type="checkbox">
            </div>

            <div class="xq-row">
                <label>自动打开第一个未完成小节</label>
                <input id="xq-auto-lesson" class="xq-switch" type="checkbox">
            </div>

            <div class="xq-row">
                <label>视频结束自动下一课</label>
                <input id="xq-auto-next" class="xq-switch" type="checkbox">
            </div>

            <div class="xq-row">
                <label>视频暂停自动恢复播放</label>
                <input id="xq-auto-resume" class="xq-switch" type="checkbox">
            </div>

            <div class="xq-row">
                <label>视频静音</label>
                <input id="xq-auto-mute" class="xq-switch" type="checkbox">
            </div>

            <div class="xq-actions">
                <button id="xq-start" class="xq-action-btn xq-start">开始脚本</button>
                <button id="xq-stop" class="xq-action-btn xq-stop">暂停脚本</button>
            </div>

            <div id="xq-status" class="xq-status"></div>
        `;

        document.body.appendChild(fab);
        document.body.appendChild(drawer);

        const autoCourse = drawer.querySelector('#xq-auto-course');
        const autoLesson = drawer.querySelector('#xq-auto-lesson');
        const autoNext = drawer.querySelector('#xq-auto-next');
        const autoResume = drawer.querySelector('#xq-auto-resume');
        const autoMute = drawer.querySelector('#xq-auto-mute');
        const startBtn = drawer.querySelector('#xq-start');
        const stopBtn = drawer.querySelector('#xq-stop');
        const status = drawer.querySelector('#xq-status');

        function syncUI() {
            autoCourse.checked = settings.autoOpenCourse;
            autoLesson.checked = settings.autoOpenLesson;
            autoNext.checked = settings.autoNextVideo;
            autoResume.checked = settings.autoResumeVideo;
            autoMute.checked = settings.autoMuteVideo;
            status.textContent = `当前状态：${settings.enabled ? '运行中' : '已暂停'}`;
            placeDrawer();
        }

        let dragging = false;
        let moved = false;
        let startX = 0;
        let startY = 0;
        let startTop = 0;
        let startRight = 0;

        fab.addEventListener('mousedown', (e) => {
            dragging = true;
            moved = false;
            startX = e.clientX;
            startY = e.clientY;
            startTop = parseInt(fab.style.top, 10);
            startRight = parseInt(fab.style.right, 10);
            e.preventDefault();
        });

        document.addEventListener('mousemove', (e) => {
            if (!dragging) {
                return;
            }

            const dx = e.clientX - startX;
            const dy = e.clientY - startY;

            if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
                moved = true;
            }

            fab.style.right = `${Math.max(0, startRight - dx)}px`;
            fab.style.top = `${Math.max(0, startTop + dy)}px`;
            placeDrawer();
        });

        document.addEventListener('mouseup', () => {
            if (!dragging) {
                return;
            }

            dragging = false;
            saveFabPos({
                top: parseInt(fab.style.top, 10),
                right: parseInt(fab.style.right, 10)
            });
        });

        fab.addEventListener('click', (e) => {
            if (moved) {
                moved = false;
                e.preventDefault();
                e.stopPropagation();
                return;
            }

            drawer.classList.toggle('show');
            syncUI();
        });

        autoCourse.onchange = () => {
            settings.autoOpenCourse = autoCourse.checked;
            saveSettings();
        };

        autoLesson.onchange = () => {
            settings.autoOpenLesson = autoLesson.checked;
            saveSettings();
        };

        autoNext.onchange = () => {
            settings.autoNextVideo = autoNext.checked;
            saveSettings();
            rerunCurrentPageLogic();
        };

        autoResume.onchange = () => {
            settings.autoResumeVideo = autoResume.checked;
            saveSettings();
            rerunCurrentPageLogic();
        };

        autoMute.onchange = () => {
            settings.autoMuteVideo = autoMute.checked;
            saveSettings();
            applyImmediateVideoSettings();
            rerunCurrentPageLogic();
        };

        startBtn.onclick = async () => {
            settings.enabled = true;
            saveSettings();
            syncUI();
            drawer.classList.remove('show');
            showPanel('脚本已启动，正在执行当前页逻辑...');
            await rerunCurrentPageLogic();
        };

        stopBtn.onclick = () => {
            settings.enabled = false;
            saveSettings();
            syncUI();
            drawer.classList.remove('show');
            clearRuntimeControlOnPause();
            showPanel('脚本已暂停。');
        };

        window.addEventListener('resize', placeDrawer);
        syncUI();
    }

    async function rerunCurrentPageLogic() {
        if (rerunLock) {
            return;
        }

        rerunLock = true;

        try {
            if (!settings.enabled) {
                showPanel('脚本已暂停。');
                return;
            }

            hasTriggered = false;

            if (isStudyListPage()) {
                showPanel('脚本已启动，正在扫描未达标课程...');
                const ok = await waitForStudyCards();
                if (ok) {
                    runStudyListPage();
                } else {
                    showPanel('课程列表加载失败，未找到课程卡片。');
                }
                return;
            }

            if (isCourseIndexPage()) {
                showPanel('脚本已启动，正在扫描未完成小节...');
                const ok = await waitForLessonItems();
                if (ok) {
                    runCourseIndexPage();
                } else {
                    showPanel('课程目录加载失败，未找到课时列表。');
                }
                return;
            }

            if (isVideoPage()) {
                showPanel('脚本已启动，正在接管当前视频页...');
                await sleep(500);
                scanAndBindVideo();
            }
        } finally {
            rerunLock = false;
        }
    }

    function setupCrossDomainSync() {
        GM_addValueChangeListener(SETTINGS_KEY, async function (_name, _oldValue, newValue, remote) {
            if (!remote) {
                return;
            }

            settings = { ...defaultSettings, ...(newValue || {}) };
            log('检测到跨域设置同步:', settings);

            const drawer = document.getElementById('xq-drawer');
            if (drawer) {
                const autoCourse = drawer.querySelector('#xq-auto-course');
                const autoLesson = drawer.querySelector('#xq-auto-lesson');
                const autoNext = drawer.querySelector('#xq-auto-next');
                const autoResume = drawer.querySelector('#xq-auto-resume');
                const autoMute = drawer.querySelector('#xq-auto-mute');
                const status = drawer.querySelector('#xq-status');

                if (autoCourse) autoCourse.checked = settings.autoOpenCourse;
                if (autoLesson) autoLesson.checked = settings.autoOpenLesson;
                if (autoNext) autoNext.checked = settings.autoNextVideo;
                if (autoResume) autoResume.checked = settings.autoResumeVideo;
                if (autoMute) autoMute.checked = settings.autoMuteVideo;
                if (status) status.textContent = `当前状态：${settings.enabled ? '运行中' : '已暂停'}`;
            }

            if (!settings.enabled) {
                clearRuntimeControlOnPause();
                showPanel('脚本已被其他页面暂停。');
                return;
            }

            applyImmediateVideoSettings();
            await rerunCurrentPageLogic();
        });

        GM_addValueChangeListener(FAB_POS_KEY, function (_name, _oldValue, newValue, remote) {
            if (!remote || !newValue) {
                return;
            }

            const fab = document.getElementById('xq-fab');
            const drawer = document.getElementById('xq-drawer');

            if (fab) {
                fab.style.top = `${newValue.top}px`;
                fab.style.right = `${newValue.right}px`;
            }

            if (fab && drawer) {
                const fabRect = fab.getBoundingClientRect();
                drawer.style.top = `${fabRect.top + 58}px`;
                drawer.style.right = `${Math.max(20, window.innerWidth - fabRect.right)}px`;
            }
        });
    }

    async function boot() {
        addStyle();
        renderControlUI();
        ensurePanel();
        setupCrossDomainSync();

        if (!settings.enabled) {
            showPanel('脚本当前已暂停。可点击悬浮球开启。');
            return;
        }

        if (isStudyListPage()) {
            const ok = await waitForStudyCards();
            if (ok) {
                runStudyListPage();
            } else {
                showPanel('课程列表加载失败，未找到课程卡片。');
            }
            return;
        }

        if (isCourseIndexPage()) {
            const ok = await waitForLessonItems();
            if (ok) {
                runCourseIndexPage();
            } else {
                showPanel('课程目录加载失败，未找到课时列表。');
            }
            return;
        }

        if (isVideoPage()) {
            await sleep(1000);
            scanAndBindVideo();

            let pending = false;
            const observer = new MutationObserver(() => {
                if (pending) {
                    return;
                }

                pending = true;
                setTimeout(() => {
                    scanAndBindVideo();
                    pending = false;
                }, 500);
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true
            });

            let retryCount = 0;
            const timer = setInterval(() => {
                retryCount++;
                scanAndBindVideo();

                if (document.querySelector('video') || retryCount >= 8) {
                    clearInterval(timer);
                }
            }, 1500);
        }
    }

    boot();
})();
