package mailer

import (
	"bytes"
	"embed"
	"marble/internal"
	"time"

	ht "html/template"
	tt "text/template"

	"github.com/wneessen/go-mail"
)

//go:embed "templates"
var templateFS embed.FS

type Mailer struct {
	client *mail.Client
	sender string
}

func New(host string, port int, username, password, sender string, env string) (*Mailer, error) {
	var client *mail.Client
	var err error
	switch env {
	case internal.EnvDevelopment, internal.EnvDebug:
		// we use ailpit for dev and testing purpeses, for easyer
		// integration we set NoTLS on.
		client, err = mail.NewClient(
			host,
			mail.WithPort(port),
			mail.WithTLSPolicy(mail.NoTLS),
			mail.WithTimeout(5*time.Second),
			mail.WithDebugLog(),
		)
	default:
		client, err = mail.NewClient(
			host,
			mail.WithSMTPAuth(mail.SMTPAuthLogin),
			mail.WithPort(port),
			mail.WithUsername(username),
			mail.WithPassword(password),
			mail.WithTimeout(5*time.Second),
		)
	}
	if err != nil {
		return nil, err
	}
	mailer := &Mailer{
		client: client,
		sender: sender,
	}
	return mailer, nil
}

func (m *Mailer) Send(recipient string, templateFile string, data any) error {
	textTmpl, err := tt.New("").ParseFS(templateFS, "templates/"+templateFile)
	if err != nil {
		return err
	}

	subject := new(bytes.Buffer)
	err = textTmpl.ExecuteTemplate(subject, "subject", data)
	if err != nil {
		return err
	}

	plainBody := new(bytes.Buffer)
	err = textTmpl.ExecuteTemplate(plainBody, "plainBody", data)
	if err != nil {
		return err
	}

	htmlTmpl, err := ht.New("").ParseFS(templateFS, "templates/"+templateFile)
	if err != nil {
		return err
	}

	htmlBody := new(bytes.Buffer)
	err = htmlTmpl.ExecuteTemplate(htmlBody, "htmlBody", data)
	if err != nil {
		return err
	}

	msg := mail.NewMsg()

	err = msg.To(recipient)
	if err != nil {
		return err
	}

	err = msg.From(m.sender)
	if err != nil {
		return err
	}

	msg.Subject(subject.String())
	msg.SetBodyString(mail.TypeTextPlain, plainBody.String())
	msg.AddAlternativeString(mail.TypeTextHTML, htmlBody.String())
	return m.client.DialAndSend(msg)
}
