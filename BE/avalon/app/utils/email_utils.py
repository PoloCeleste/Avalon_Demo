import smtplib
from email.mime.text import MIMEText
from email.header import Header
from email.utils import formataddr
from ..core.config import settings
from ..core.logging import app_logger

async def send_email(to_email: str, subject: str, body: str):
    msg = MIMEText(body, 'html', 'utf-8')
    msg['Subject'] = Header(s=subject, charset='utf-8')
    msg['From'] = formataddr((str(Header(s='Avalon Langcon 관리자', charset='utf-8')), settings.mail_from))
    msg['To'] = to_email

    try:
        with smtplib.SMTP(settings.mail_server, settings.mail_port) as server:
            if settings.mail_use_tls:
                server.starttls()
            if settings.mail_username and settings.mail_password:
                server.login(settings.mail_username, settings.mail_password)
            server.send_message(msg)
        app_logger.info(f"Email sent successfully to {to_email} with subject '{subject}'")
    except Exception as e:
        app_logger.error(f"Failed to send email to {to_email} with subject '{subject}': {e}", exc_info=True)
        raise

async def send_password_reset_email(to_email: str, username: str, reset_link: str):
    subject = "[Avalon Langcon] 비밀번호 재설정 안내"
    body = f"""
    <html>
    <body>
        <p>안녕하세요, {username}님.</p>
        <p>Avalon Langcon 계정의 비밀번호 재설정 요청이 접수되었습니다.</p>
        <p>아래 링크를 클릭하여 비밀번호를 재설정해 주세요:</p>
        <p><a href="{reset_link}">비밀번호 재설정하러 가기</a></p>
        <p>이 링크는 5분 동안만 유효합니다. 만약 본인이 요청하지 않았다면, 이 이메일을 무시해 주세요.</p>
        <br>
        <p>감사합니다.</p>
        <p>Avalon Langcon 관리자 드림</p>
    </body>
    </html>
    """
    await send_email(to_email, subject, body)
