import Figure from "@/components/Figure";
import DocsLayout from "@/layouts/DocsLayout";

export async function getStaticProps(context) {
  return {
    props: {},
  };
}

export default function Doc(props) {
  return (
    <DocsLayout title="Setup">
      <>
        <p>Go to https://console.firebase.google.com/</p>
        <Figure img="/images/docs/Fig.1.png" title="fig 1" />
        <ul>
          <li>
            Choose from one of the four templates (kiosk, scroll, slides, quiz).
          </li>
          <li>You can change your template later via the editor. </li>
        </ul>
        <p>Below is a brief description of each template:</p>
        <table>
          <tbody>
            <tr>
              <td>
                <strong>Kiosk</strong>
              </td>
              <td>
                Uses the slides presentation mode. The kiosk template enables
                you to set the duration of each slide within autoplay mode.
              </td>
            </tr>
            <tr>
              <td>
                <strong>Scroll</strong>
              </td>
              <td>
                A single scrolling website which moves seamlessly between items
                in your exhibit.
              </td>
            </tr>
            <tr>
              <td>
                <strong>Slides</strong>
              </td>
              <td>
                A presentation-style layout where the user can click forward and
                backward between individual slides.
              </td>
            </tr>
            <tr>
              <td>
                <strong>Quiz</strong>
              </td>
              <td>
                Uses the slides presentation mode. Create your own interactive
                quizzes using multiple choice and pinpoints.
              </td>
            </tr>
          </tbody>
        </table>
        <p>
          All templates follow the same process for editing settings, importing
          items, adding item descriptions, saving, sharing, and embedding. These
          are described in more detail in this section of the documentation.
        </p>
        <p>
          Information specific to individual templates can be found under the{" "}
          <a href="/docs/scroll-template">templates</a> section of the
          documentation.
        </p>
      </>
    </DocsLayout>
  );
}
