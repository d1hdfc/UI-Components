 import { Button } from './components/Button'
 export default function App() {
   return (
       <section className="card">
         <h2>Button Variants & Sizes</h2>
         <div style={{ display: 'flex', gap: 12,  margin: '16px 0', alignItems: 'center' }}>
           <Button variant="primary" size="large" leftIcon={true} rightIcon={true}>Button</Button>
           <Button variant="primary" size="medium" leftIcon={true} rightIcon={true}>Button</Button>
           <Button variant="primary" size="small" leftIcon={true} rightIcon={true}>Button</Button>
           <Button variant="primary" size="xsmall" leftIcon={true} rightIcon={true}>Button</Button>
         </div>
         <div style={{ display: 'flex', gap: 12,  margin: '16px 0', alignItems: 'center' }}>
           <Button variant="secondary" size="large" leftIcon={true} rightIcon={true}>Button</Button>
           <Button variant="secondary" size="medium" leftIcon={true} rightIcon={true}>Button</Button>
           <Button variant="secondary" size="small" leftIcon={true} rightIcon={true}>Button</Button>
           <Button variant="secondary" size="xsmall" leftIcon={true} rightIcon={true}>Button</Button>
         </div>
         <div style={{ display: 'flex', gap: 12,  margin: '16px 0', alignItems: 'center' }}>
           <Button variant="white" size="large" leftIcon={true} rightIcon={true}>Button</Button>
           <Button variant="white" size="medium" leftIcon={true} rightIcon={true}>Button</Button>
           <Button variant="white" size="small" leftIcon={true} rightIcon={true}>Button</Button>
           <Button variant="white" size="xsmall" leftIcon={true} rightIcon={true}>Button</Button>
         </div>
       </section>
   )
 }