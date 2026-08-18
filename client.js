window.__ModuleLoader__.load({
  id: 'dsh-wecom-cli',
  factory: (require) => {
    const module = { exports: {} }
    const React = require('react')
    const { useCallback, useEffect, useState } = React
    const route = '/api2/dsh-wecom-cli/setup'
    const styles = {
      root: { display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 860, width: '100%' },
      card: { padding: 16, border: '1px solid var(--dsw-alias-border-l2)', borderRadius: 12, background: 'var(--dsw-alias-bg-layer-1)' },
      row: { display: 'flex', gap: 9, alignItems: 'center', flexWrap: 'wrap' },
      muted: { color: 'var(--dsw-alias-label-tertiary)', fontSize: 13, lineHeight: 1.6 },
      button: { border: '1px solid var(--dsw-alias-border-l2)', borderRadius: 8, padding: '8px 12px', background: 'var(--dsw-alias-bg-layer-2)', color: 'var(--dsw-alias-label-primary)', cursor: 'pointer' },
      input: { border: '1px solid var(--dsw-alias-border-l2)', borderRadius: 8, padding: '8px 10px', background: 'var(--dsw-alias-bg-layer-2)', color: 'var(--dsw-alias-label-primary)' },
      code: { padding: '8px 10px', borderRadius: 8, background: 'var(--dsw-alias-bg-layer-2)', overflowWrap: 'anywhere', fontSize: 12 },
    }
    async function post(action, extra = {}, intent = null) {
      const headers = { 'content-type': 'application/json' }; if (intent) headers['x-dsh-wecom-intent'] = intent
      const response = await fetch(route, { method: 'POST', headers, body: JSON.stringify({ action, ...extra }) })
      const payload = await response.json(); if (!response.ok || !payload.ok) throw new Error(payload?.error?.message || `HTTP ${response.status}`)
      return payload.value
    }
    function SetupPanel() {
      const [state, setState] = useState(null); const [confirmation, setConfirmation] = useState(''); const [installConfirmation, setInstallConfirmation] = useState(''); const [message, setMessage] = useState('')
      const refresh = useCallback(async () => { try { setState(await post('status')); setMessage('') } catch (error) { setMessage(error.message) } }, [])
      useEffect(() => { refresh(); const timer = setInterval(refresh, 2500); return () => clearInterval(timer) }, [refresh])
      const copyInstall = async () => { await navigator.clipboard.writeText(state.installCommand); setMessage('安装命令已复制，请在终端执行后回来刷新。') }
      const install = async () => { try { setState(await post('install', { confirmation: installConfirmation }, 'install')); setMessage('正在安装企业微信官方 CLI，完成后会自动检测。') } catch (error) { setMessage(error.message) } }
      const cancelInstall = async () => { try { setState(await post('cancel-install', {}, 'cancel-install')); setMessage('已请求取消安装。') } catch (error) { setMessage(error.message) } }
      const authorize = async () => { try { setState(await post('authorize', { confirmation }, 'authorize')); setMessage('授权已启动，请使用企业微信扫描二维码。') } catch (error) { setMessage(error.message) } }
      const cancel = async () => { try { setState(await post('cancel', {}, 'cancel')); setMessage('授权已取消。') } catch (error) { setMessage(error.message) } }
      const test = async () => { try { await post('test'); setMessage('连接成功，可以在对话中使用企业微信只读查询。'); await refresh() } catch (error) { setMessage(error.message) } }
      const auth = state?.auth
      return React.createElement('section', { style: styles.root },
        React.createElement('div', null, React.createElement('h2', { style: { margin: 0 } }, '企业微信'), React.createElement('p', { style: styles.muted }, '安装 CLI、扫码授权、连接测试和能力说明。插件不会显示或接收 Bot Secret。')),
        React.createElement('div', { style: styles.card }, React.createElement('h3', { style: { marginTop: 0 } }, '1. 官方 CLI'),
          state?.installed ? React.createElement('p', null, `已安装 ${state.version || '版本未知'}`) : React.createElement(React.Fragment, null,
            React.createElement('p', { style: styles.muted }, state?.install?.state === 'installing' ? '正在安装官方 wecom-cli，请稍候…' : '尚未检测到 wecom-cli。输入 INSTALL WECOM CLI 后可直接安装。'),
            React.createElement('div', { style: styles.code }, state?.installCommand || 'npm install --global @wecom/cli@1.1.0'),
            React.createElement('div', { style: styles.row },
              React.createElement('input', { style: styles.input, value: installConfirmation, disabled: state?.install?.state === 'installing', onChange: event => setInstallConfirmation(event.target.value), placeholder: 'INSTALL WECOM CLI' }),
              React.createElement('button', { style: styles.button, disabled: installConfirmation !== 'INSTALL WECOM CLI' || state?.install?.state === 'installing', onClick: install }, '安装官方 CLI'),
              React.createElement('button', { style: styles.button, onClick: copyInstall }, '复制命令'),
              state?.install?.state === 'installing' && React.createElement('button', { style: styles.button, onClick: cancelInstall }, '取消安装')),
            state?.install?.error && React.createElement('p', { style: styles.muted, role: 'alert' }, state.install.error))),
        React.createElement('div', { style: styles.card }, React.createElement('h3', { style: { marginTop: 0 } }, '2. 企业微信授权'),
          React.createElement('p', { style: styles.muted }, state?.authorized ? '已授权。' : '输入 AUTHORIZE WECOM 后启动官方扫码授权；二维码五分钟失效。'),
          state?.installed && !state?.authorized && React.createElement('div', { style: styles.row }, React.createElement('input', { style: styles.input, value: confirmation, onChange: event => setConfirmation(event.target.value), placeholder: 'AUTHORIZE WECOM' }), React.createElement('button', { style: styles.button, disabled: confirmation !== 'AUTHORIZE WECOM', onClick: authorize }, '开始扫码授权')),
          auth?.qrDataUrl && React.createElement('img', { src: auth.qrDataUrl, alt: '企业微信授权二维码', style: { width: 240, height: 240, marginTop: 12, background: '#fff', padding: 8 } }),
          ['starting', 'waiting-scan'].includes(auth?.state) && React.createElement('button', { style: styles.button, onClick: cancel }, '取消授权')),
        React.createElement('div', { style: styles.card }, React.createElement('h3', { style: { marginTop: 0 } }, '3. 连接与使用'), React.createElement('div', { style: styles.row }, React.createElement('button', { style: styles.button, onClick: refresh }, '刷新状态'), React.createElement('button', { style: styles.button, disabled: !state?.authorized, onClick: test }, '测试连接')), React.createElement('p', { style: styles.muted }, '连接成功后可在对话中搜索联系人、文档、会议、日程、邮件、待办、微盘和表格。当前版本仍禁止发送、创建、修改、删除、上传和下载。')),
        message && React.createElement('div', { style: styles.card, role: 'status' }, message))
    }
    const name = 'dsh-wecom-cli-client'; const inject = ['slots']
    function apply(ctx) { ctx.slots.inject('settings.section', () => ctx.slots.register({ name: 'settings.section', id: 'dsh-wecom-cli', order: 18, label: () => '企业微信', inject: () => ({}) }, SetupPanel)) }
    module.exports = { name, inject, apply }; return module.exports
  },
})
